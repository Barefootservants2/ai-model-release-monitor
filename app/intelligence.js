// Private profiles remain in memory. Never transmit profile or cost-form data.
let stackProfile = null;
const norm = value => String(value || '').trim().toLowerCase();
function canonicalOrg(value) {
  const n = norm(value);
  return ({'google deepmind':'google','google ai':'google','openai / chatgpt':'openai','xai / grok':'xai'})[n] || n;
}
function validateProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Profile must be a JSON object.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.as_of || '') || !Number.isFinite(Date.parse(value.as_of)) || new Date(value.as_of).toISOString().slice(0,10)!==value.as_of) throw Error('Add a valid as_of date in YYYY-MM-DD format.');
  if (new Date(value.as_of).getTime() > Date.now() + 86400000) throw Error('Profile date cannot be in the future.');
  if (!Array.isArray(value.products) || value.products.length > 200) throw Error('Provide a products array with at most 200 entries.');
  const allowed = new Set(['documented','user-confirmed','runtime-verified','historical']);
  const products = value.products.map(item => {
    if (!item || typeof item.org !== 'string' || !item.org.trim() || !allowed.has(item.status)) throw Error('Every entry needs an org and an accepted status.');
    for (const key of ['org','name','version']) if (item[key] != null && (typeof item[key] !== 'string' || item[key].length > 160)) throw Error('Product fields must be short strings.');
    return {org:item.org.trim(), name:(item.name || '').trim(), version:(item.version || '').trim(), status:item.status};
  });
  return {as_of:value.as_of, complete:value.complete === true, products};
}
function matchStack(item, profile=stackProfile) {
  if (!profile) return {kind:'unknown',label:'Estate unknown',detail:'No inventory supplied.'};
  const age = (Date.now() - new Date(profile.as_of).getTime()) / 86400000;
  const records = profile.products.filter(p => p.status !== 'historical' && canonicalOrg(p.org) === canonicalOrg(item.org));
  const exact = records.find(p => p.name && norm(p.name) === norm(item.name || item.product));
  const suffix = age > 30 ? ' · stale profile' : '';
  if (exact) return {kind:'exact',label:'Exact product listed'+suffix,detail:`${exact.status}; listed version ${exact.version || 'unknown'}. Affected-version applicability is not determined.`};
  if (records.length) return {kind:'provider',label:'Provider overlap'+suffix,detail:`${records.map(p=>p.status).join(', ')}. Exact product, entitlement and usage are not established.`};
  return {kind:'unlisted',label:'Not in supplied profile'+suffix,detail:profile.complete ? 'User marked this inventory complete; independently unverified.' : 'Inventory is incomplete; this is not proof of absence from your estate.'};
}
function signalFor(item) {
  return state.signals.find(s => recordKey(s) === recordKey(item));
}
function decisionBadges(item) {
  const s = signalFor(item), m = matchStack(item);
  return `<div class="decision-flags"><span class="decision-flag estate" title="${escapeAttr(m.detail)}">${escapeHtml(m.label)}</span><span class="decision-flag capability">${escapeHtml(s?.capability_flag || 'Capability unreviewed')}</span><span class="decision-flag cost">${escapeHtml(s?.cost_flag || 'Cost unreviewed')}</span></div>
    ${s ? `<details class="signal-detail"><summary>Why these signals?</summary><p><strong>Capability:</strong> ${escapeHtml(s.capability_reason)}</p><p><strong>Cost mechanism:</strong> ${escapeHtml(s.cost_mechanism)}</p><p>${escapeHtml(s.cost_reason)} Baseline: ${escapeHtml(s.baseline)}. Unit: ${escapeHtml(s.units)}.</p><p><strong>Estate:</strong> ${escapeHtml(m.detail)}</p></details>` : ''}`;
}
function updateProfileUI() {
  const message = stackProfile ? `${stackProfile.products.length} supplied entries · as of ${stackProfile.as_of} · ${stackProfile.complete ? 'user-marked complete' : 'incomplete'} · held in this page only` : 'No stack profile loaded. Estate membership is unknown, not absent.';
  document.querySelector('#profile-note').textContent = message;
  document.querySelector('#profile-status').textContent = message;
  renderAssessments(); renderEvents(); render();
}
function renderEvents() {
  const type = document.querySelector('#event-type').value;
  const query = norm(document.querySelector('#event-search').value);
  const rows = state.events.filter(e=>(type==='All types'||e.event_type===type)&&(!query||norm(Object.values(e).join(' ')).includes(query)))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  document.querySelector('#event-status').textContent = `${rows.length} changes shown. Dates are publisher announcement dates; NEW means detected in the latest scan. Baseline backfills are not marked new. ${state.extendedWarning || ''}`;
  document.querySelector('#event-list').innerHTML = rows.map(e=>{
    const m = matchStack(e), url=safeUrl(e.source_url);
    return `<article class="assessment"><div class="review-top"><span class="recommendation watch">${escapeHtml(e.event_type)}</span><span>${escapeHtml(e.date)}</span><span class="decision-flag estate" title="${escapeAttr(m.detail)}">${escapeHtml(m.label)}</span></div><h3>${escapeHtml(e.product)} <span>${escapeHtml(e.version)}</span></h3><p>${escapeHtml(e.summary)}</p><div class="review-summary"><div><h4>What to check</h4><p>${escapeHtml(e.action)}</p></div><div><h4>Evidence &amp; applicability</h4><p>${escapeHtml(e.status)}. ${escapeHtml(m.detail)}</p><p>${escapeHtml(e.evidence)}. Cost signal: ${escapeHtml(e.cost_flag)}.</p></div></div><details><summary>Affected and fixed versions</summary><p>Affected: ${escapeHtml(e.affected_versions)}.</p><p>Fixed / replacement: ${escapeHtml(e.fixed_versions)}.</p></details>${url?`<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Read publisher evidence</a>`:''}</article>`;
  }).join('') || '<p class="empty-state">No matching recorded changes. This does not prove the absence of incidents or defects.</p>';
  labelFeedLinks('#event-list');
}
function renderSources() {
  document.querySelector('#source-status').textContent = `${state.sources.length} registered direct sources. ${state.extendedWarning || ''}`;
  document.querySelector('#source-list').innerHTML = state.sources.map(s=>{
    const url=safeUrl(s.url);
    return `<article class="source-row"><div><h3>${escapeHtml(s.publisher)} <span>${escapeHtml(s.source_type)}</span></h3><p>${escapeHtml(s.covers)}</p><p class="muted">${escapeHtml(s.caveat)}</p></div><div><p>Checked ${escapeHtml(s.last_checked)}</p><p class="muted">${escapeHtml(s.fetch_status)} · ${escapeHtml(s.priority)}</p>${url?`<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Open official source</a>`:''}</div></article>`;
  }).join('');
  labelFeedLinks('#source-list');
}
function labelFeedLinks(selector){
  document.querySelectorAll(selector+' a[href]').forEach(a=>{
    const url=safeUrl(a.href);if(url)a.textContent='Feed link: '+new URL(url).hostname;
  });
}
function calculateCosts(v) {
  const keys=['tasks','inputTokens','outputTokens','baseIn','baseOut','baseAttempts','baseFixed','newIn','newOut','newAttempts','newFixed','migration','months'];
  if(keys.some(k=>!Number.isFinite(v[k])||v[k]<0)||v.tasks<1||v.months<1||v.baseAttempts<1||v.newAttempts<1) throw Error('Use finite nonnegative values, at least one task/month and at least one attempt per successful task.');
  const base = v.tasks * v.baseAttempts * (v.inputTokens*v.baseIn+v.outputTokens*v.baseOut)/1e6+v.baseFixed;
  const candidate = v.tasks * v.newAttempts * (v.inputTokens*v.newIn+v.outputTokens*v.newOut)/1e6+v.newFixed+v.migration/v.months;
  if(!Number.isFinite(base)||!Number.isFinite(candidate))throw Error('Scenario exceeds supported numeric range. Use smaller values.');
  return {base,candidate,delta:base-candidate,baseUnit:base/v.tasks,newUnit:candidate/v.tasks};
}
function renderVersions() {
  const query=norm(document.querySelector('#version-search').value);
  const access=document.querySelector('#version-access')?.value||'All';
  const groups=new Map();
  state.versions.filter(v=>access==='All'||norm(v.tier).includes(norm(access))).forEach(v=>{const key=norm(v.org)+'|'+norm(v.family);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);});
  const visible=[...groups.values()].filter(rows=>!query||norm(JSON.stringify(rows)).includes(query));
  document.querySelector('#version-status').textContent=`${groups.size} families have documented history; ${visible.length} shown. History coverage is partial, not a completed audit of the release catalog. ${state.extendedWarning||''}`;
  document.querySelector('#version-list').innerHTML=visible.map(rows=>{
    const slots=['Current','Previous 1','Previous 2'];
    return `<article class="assessment"><h3>${escapeHtml(rows[0].family)} · ${escapeHtml(rows[0].org)}</h3>${slots.map(slot=>{
      const offerings=rows.filter(r=>r.relation===slot);
      if(!offerings.length)return `<p><strong>${slot}:</strong> No verified record in this view. Clear the access filter to distinguish a missing record from a filtered offering.</p>`;
      return offerings.map(v=>{
      const links=String(v.source_url||'').split(' | ').map(safeUrl).filter(Boolean);
      return `<div class="source-row"><div><h4>${slot}: ${escapeHtml(v.version)}</h4><p>Product / variant: ${escapeHtml(v.product)}. Released: ${escapeHtml(v.released||'Unknown')}.</p><p>${escapeHtml(v.access_channel)} · Tier: ${escapeHtml(v.tier)}</p><p>Price: ${escapeHtml(v.price)} ${escapeHtml(v.price_unit)}.</p><p>Availability: ${escapeHtml(v.availability)}. Support: ${escapeHtml(v.support_status)}.</p></div><div><p>Checked ${escapeHtml(v.checked_at)}</p>${links.map((url,i)=>`<p><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Evidence ${i+1}</a></p>`).join('')}</div></div>`;
      }).join('');
    }).join('')}</article>`;
  }).join('')||'<p>No matching documented history. Missing versions are not evidence of unavailability.</p>';
  labelFeedLinks('#version-list');
}
document.querySelector('#version-search').addEventListener('input',renderVersions);
document.querySelector('#version-access').addEventListener('change',renderVersions);
function renderProviderPicker(){
  const root=document.querySelector('#provider-picker');
  if(root.children.length)return;
  const providers=[...new Set(state.releases.map(r=>r.org).concat(state.versions.map(r=>r.org)))].sort();
  providers.forEach(org=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=org;label.append(input,document.createTextNode(org));root.append(label);});
}
document.querySelector('#apply-providers').addEventListener('click',()=>{
  const selected=[...document.querySelectorAll('#provider-picker input:checked')];
  if(!selected.length){document.querySelector('#profile-status').textContent='Choose at least one provider, or use Clear profile.';return;}
  stackProfile=validateProfile({as_of:new Date().toISOString().slice(0,10),complete:false,products:selected.map(i=>({org:i.value,name:'',version:'',status:'user-confirmed'}))});
  document.querySelector('#profile-json').value=JSON.stringify(stackProfile,null,2);updateProfileUI();
});
document.querySelector('#apply-profile').addEventListener('click',()=>{
  try { const text=document.querySelector('#profile-json').value; if(text.length>50000) throw Error('Profile exceeds 50 KB.'); stackProfile=validateProfile(JSON.parse(text)); updateProfileUI(); }
  catch(e){document.querySelector('#profile-status').textContent=`Profile not applied: ${e.message}`;}
});
document.querySelector('#profile-file').addEventListener('change',async event=>{
  const file=event.target.files[0]; if(!file)return;
  try {if(file.size>50000)throw Error('Profile exceeds 50 KB.');const text=await file.text();stackProfile=validateProfile(JSON.parse(text));document.querySelector('#profile-json').value=text;updateProfileUI();}
  catch(e){document.querySelector('#profile-status').textContent=`Profile not applied: ${e.message}`;}
});
document.querySelector('#clear-profile').addEventListener('click',()=>{stackProfile=null;document.querySelector('#profile-json').value='';document.querySelector('#profile-file').value='';document.querySelectorAll('#provider-picker input').forEach(i=>i.checked=false);updateProfileUI();});
document.querySelector('#event-type').addEventListener('change',renderEvents);
document.querySelector('#event-search').addEventListener('input',renderEvents);
document.querySelector('#cost-form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const v=Object.fromEntries([...new FormData(event.target)].map(([k,val])=>[k,Number(val)]));
    const r=calculateCosts(v), usd=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
    document.querySelector('#cost-result').textContent=`Scenario: current ${usd(r.base)}/month; candidate ${usd(r.candidate)}/month including amortized migration. ${r.delta>=0?'Potential reduction':'Potential increase'}: ${usd(Math.abs(r.delta))}/month. Per successful task: $${r.baseUnit.toFixed(4)} vs $${r.newUnit.toFixed(4)}. Assumes equal acceptable quality; not measured savings.`;
  } catch(e){document.querySelector('#cost-result').textContent=e.message;}
});
