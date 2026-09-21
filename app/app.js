// AI Model Release Monitor — client logic
const SHEET_ID = '1BNcJ3tfjWyn1awDEeM5Jn5Zqjt_vGwdSmcHMcuZrBbg';
const RELEASES_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=releases`;
const META_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=meta`;
const ASSESSMENTS_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=assessments`;
const API_BASE = '__PORT_5000__'.startsWith('__') ? '' : '__PORT_5000__';

const state = {
  data: null,
  releases: [],
  assessments: [],
  signals: [],
  events: [],
  sources: [],
  versions: [],
  extendedWarning: '',
  assessmentError: '',
  controlsBound: false,
  loading: false,
  feedChecks: [],
  filteredCategory: 'All',
  filteredLicense: 'All',
  search: '',
  sortKey: 'date',
  sortDir: 'desc',
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Minimal CSV parser supporting quoted fields with embedded commas/quotes
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQ = false; }
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().replace(/^\uFEFF/, ''));
  return rows.slice(1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    return o;
  });
}

async function load() {
  if (state.loading) return;
  state.loading = true;
  state.feedChecks = [];
  $('#status-label').textContent = 'Refreshing';
  $('#reload').disabled = true;
  try {
    const [relResult, metaResult, assessmentResult, signalResult, eventResult, sourceResult, versionResult] = await Promise.allSettled([
      fetchRows(RELEASES_CSV, ['name', 'org']),
      fetchRows(META_CSV, ['key', 'value']),
      fetchRows(ASSESSMENTS_CSV, ['name', 'org', 'recommendation']),
      fetchRows(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=signals`, ['name','org','cost_flag']),
      fetchRows(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=events`, ['event_id','event_type']),
      fetchRows(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=sources`, ['source_id','url']),
      fetchRows(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=versions`, ['family','version','access_channel']),
    ]);
    if (relResult.status !== 'fulfilled') throw new Error('Release feed unavailable');
    const releases = relResult.value.filter(r => r.name && r.org);
    const metaObj = {};
    if (metaResult.status === 'fulfilled') metaResult.value.forEach(r => { if (r.key) metaObj[r.key] = r.value; });
    state.assessments = assessmentResult.status === 'fulfilled' ? assessmentResult.value.filter(r => r.name && r.org) : [];
    state.assessmentError = assessmentResult.status === 'fulfilled' ? '' : 'Assessment feed unavailable. The release timeline is still accessible; use Refresh data to retry.';
    state.signals = signalResult.status === 'fulfilled' ? signalResult.value.filter(r=>r.name&&r.org) : [];
    state.events = eventResult.status === 'fulfilled' ? eventResult.value.filter(r=>r.event_id) : [];
    state.sources = sourceResult.status === 'fulfilled' ? sourceResult.value.filter(r=>r.source_id) : [];
    state.versions = versionResult.status === 'fulfilled' ? versionResult.value.filter(r=>r.family&&r.version) : [];
    state.extendedWarning = [signalResult,eventResult,sourceResult,versionResult].some(r=>r.status!=='fulfilled') ? 'One or more extended feeds are unavailable; missing entries are not evidence of no changes.' : '';
    state.data = {
      generated_at: metaObj.last_run || '',
      last_run_label: metaObj.last_run ? formatDate(metaObj.last_run) + ' ET' : (metaObj.last_run_label || 'Unavailable'),
      next_run_label: metaObj.next_run_label || 'Schedule unavailable',
    };
    state.releases = releases;
    const scanTime = Date.parse(metaObj.last_run);
    const stale = !Number.isFinite(scanTime) || Date.now() - scanTime > 25 * 3600000;
    $('#status-label').textContent = state.feedChecks.length < 7 ? 'Partial feeds connected' : stale ? 'Feeds loaded · scan time stale or unknown' : 'Live public feeds connected';
    $('#delivery-status').textContent = `${state.feedChecks.length}/7 feeds retrieved · delivery cache up to 60 seconds. ${state.feedChecks.map(f=>f.fetched_at).filter(Boolean).sort().at(-1)||'Direct retrieval just completed'}. Collection is daily, not continuous.`;
    $('#status-dot').classList.toggle('live', !stale && state.feedChecks.length === 7);
    if(stale)state.data.next_run_label='Daily target; last successful scan overdue or unknown';
    if (/tomorrow/i.test(state.data.next_run_label) && metaObj.last_run) {
      const nextDate = new Date(metaObj.last_run);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      state.data.next_run_label = nextDate.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }) + ' · 9:00 AM ET (scheduled)';
    }
    init();
  } catch (err) {
    console.error(err);
    if (!state.releases.length) {
      try {
        const response = await fetch('snapshot.json');
        if (!response.ok) throw new Error('Snapshot unavailable');
        const snapshot = await response.json();
        state.releases = snapshot.releases;
        state.assessments = snapshot.assessments;
        state.signals = snapshot.signals || [];
        state.events = snapshot.events || [];
        state.sources = snapshot.sources || [];
        state.versions = snapshot.versions || [];
        state.extendedWarning = `Saved snapshot from ${snapshot.captured_at}; not live.`;
        state.data = {last_run_label: snapshot.captured_at + ' (snapshot)', next_run_label: 'Check Project schedule'};
        state.assessmentError = `Live Sheet connection failed. Showing the saved ${snapshot.captured_at} snapshot; open the tracker for current data.`;
        init();
        $('#status-label').textContent = 'Saved snapshot · not live';
        $('#delivery-status').textContent = `Delivery unavailable. Saved snapshot captured ${snapshot.captured_at}; it does not auto-update.`;
        $('#status-dot').classList.remove('live');
        return;
      } catch (snapshotError) { console.error(snapshotError); }
    }
    $('#status-label').textContent = state.releases.length ? 'Refresh failed · previous data shown' : 'Feed unavailable';
    $('#status-dot').classList.remove('live');
    $('#assessment-status').textContent = 'Could not refresh data. Use Refresh data to retry or open the tracker directly.';
    if (!state.releases.length) $('#assessment-coverage').textContent = 'Assessments unavailable';
    if (!state.releases.length) $('#releases-body').innerHTML = `<tr><td colspan="7" class="loading">Could not load live data. Use Refresh data to retry or open the tracker directly.</td></tr>`;
  } finally {
    state.loading = false;
    $('#reload').disabled = false;
  }
}

async function fetchRows(url, expectedHeaders) {
  const tab=new URL(url).searchParams.get('sheet');
  const delivery='server';
  const response=await fetch(`${API_BASE}/api/feeds/${encodeURIComponent(tab)}`,{cache:'no-store',signal:AbortSignal.timeout(18000)});
  if (!response.ok) throw new Error('Feed request failed');
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='',bytes=0;
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2*1024*1024){await reader.cancel();throw Error('Feed exceeds size limit');}text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();
  if (/^\s*</.test(text)) throw new Error('Feed returned HTML instead of CSV');
  const rows = parseCSV(text);
  if(rows.length>12000||rows.some(r=>r.length>30||r.some(v=>v.length>20000)))throw Error('Feed exceeds record limits');
  const header = (rows[0] || []).map(x => x.trim().replace(/^\uFEFF/, ''));
  if (!expectedHeaders.every(x => header.includes(x))) throw new Error('Feed header mismatch');
  state.feedChecks.push({tab,delivery,fetched_at:response.headers.get('X-Feed-Fetched-At')});
  return rowsToObjects(rows);
}

function init() {
  $('#last-run').textContent = state.data.last_run_label || formatDate(state.data.generated_at);
  $('#next-run').textContent = state.data.next_run_label || '—';
  renderStats();
  renderFilters();
  bindControls();
  render();
  renderAssessments();
  renderEvents();
  renderSources();
  renderVersions();
  renderProviderPicker();
}

function openLicenseLabel(value){
  return /open|apache|\bmit\b|openmdw/i.test(value)&&!/proprietary|planned|announced|staged|unspecified|not stated|unknown/i.test(value);
}
function renderStats() {
  const r = state.releases;
  const now = Date.now();
  const dayMs = 86400000;
  const days = (d) => (now - new Date(d).getTime()) / dayMs;
  $('#stat-total').textContent = r.length;
  $('#stat-7d').textContent = r.filter(x => days(x.date) >= 0 && days(x.date) <= 7).length;
  $('#stat-30d').textContent = r.filter(x => days(x.date) >= 0 && days(x.date) <= 30).length;
  $('#stat-open').textContent = r.filter(x => openLicenseLabel(x.license)).length;
  $('#stat-orgs').textContent = new Set(r.map(x => x.org)).size;
}

function renderFilters() {
  const cats = ['All', ...Array.from(new Set(state.releases.map(r => r.category))).sort()];
  const lics = ['All', 'Open-license label', 'Proprietary'];
  $('#category-filters').innerHTML = cats.map(c =>
    `<button class="chip ${c === state.filteredCategory ? 'active' : ''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`
  ).join('');
  $('#license-filters').innerHTML = lics.map(l =>
    `<button class="chip ${l === state.filteredLicense ? 'active' : ''}" data-lic="${escapeAttr(l)}">${escapeHtml(l)}</button>`
  ).join('');
}

function bindControls() {
  if (state.controlsBound) return;
  state.controlsBound = true;
  $('#search').addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase().trim();
    render();
  });
  $('#category-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.filteredCategory = btn.dataset.cat;
    renderFilters();
    render();
  });
  $('#license-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lic]');
    if (!btn) return;
    state.filteredLicense = btn.dataset.lic;
    renderFilters();
    render();
  });
  $$('th.sortable').forEach(th => {
    th.querySelector('button').addEventListener('click', () => {
    const k = th.dataset.sort;
    if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortKey = k; state.sortDir = k === 'date' ? 'desc' : 'asc'; }
    $$('th.sortable').forEach(t=>t.setAttribute('aria-sort',t.dataset.sort===state.sortKey?(state.sortDir==='asc'?'ascending':'descending'):'none'));
    render();
    });
  });
}

function render() {
  let rows = state.releases.slice();
  if (state.filteredCategory !== 'All') rows = rows.filter(r => r.category === state.filteredCategory);
  if (state.filteredLicense === 'Open-license label') rows = rows.filter(r => openLicenseLabel(r.license));
  if (state.filteredLicense === 'Proprietary') rows = rows.filter(r => /proprietary/i.test(r.license));
  if (state.search) {
    const q = state.search;
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.org.toLowerCase().includes(q) ||
      (r.highlight || '').toLowerCase().includes(q) ||
      (r.modality || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q)
    );
  }
  const dir = state.sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const av = (a[state.sortKey] || '').toString().toLowerCase();
    const bv = (b[state.sortKey] || '').toString().toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  // sort indicators
  $$('th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === state.sortKey) th.classList.add(state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
  });

  const body = $('#releases-body');
  if (rows.length === 0) {
    body.innerHTML = '';
    $('#empty-msg').classList.remove('hidden');
    return;
  }
  $('#empty-msg').classList.add('hidden');

  const now = Date.now();
  body.innerHTML = rows.map(r => {
    const isNew = String(r.is_new).toUpperCase() === 'TRUE';
    const estate = matchStack(r);
    const catKey = categoryKey(r.category);
    const licClass = /proprietary/i.test(r.license) ? 'lic-proprietary' : 'lic-open';
    const nameLink = safeUrl(r.url)
      ? `<a href="${escapeAttr(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer" title="Feed-provided link: ${escapeAttr(new URL(safeUrl(r.url)).hostname)}">${escapeHtml(r.name)}</a><small class="muted"> ${escapeHtml(new URL(safeUrl(r.url)).hostname)}</small>`
      : escapeHtml(r.name);
    return `<tr>
      <td class="cell-date">${formatShortDate(r.date)}</td>
      <td class="cell-name">${nameLink}${isNew ? '<span class="new-badge">NEW</span>' : ''}<div class="decision-flags"><span class="decision-flag estate" title="${escapeAttr(estate.detail)}">${escapeHtml(estate.label)}</span></div></td>
      <td class="cell-org">${escapeHtml(r.org)}</td>
      <td><span class="badge cat-${catKey}">${escapeHtml(r.category)}</span></td>
      <td class="cell-org">${escapeHtml(r.modality || '')}</td>
      <td class="${licClass}">${escapeHtml(r.license)}</td>
      <td class="cell-highlight">${escapeHtml(r.highlight || '')}</td>
    </tr>`;
  }).join('');
}

function categoryKey(c) {
  const lc = (c || '').toLowerCase();
  if (lc.includes('code')) return 'Code';
  if (lc.includes('image')) return 'Image';
  if (lc.includes('video')) return 'Video';
  if (lc.includes('speech') || lc.includes('audio')) return 'Speech';
  if (lc.includes('vlm')) return 'VLM';
  if (lc.includes('agent')) return 'Agent';
  if (lc.includes('reasoning')) return 'Reasoning';
  if (lc.includes('multimodal')) return 'Multimodal';
  if (lc.includes('world')) return 'World';
  return 'LLM';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unavailable' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });
}
function formatShortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
function recordKey(r) { return `${r.name.trim().toLowerCase()}|${r.org.trim().toLowerCase()}`; }
function renderAssessments() {
  const keys = new Set(state.releases.map(recordKey));
  const joined = new Map();
  state.assessments.forEach(a => {
    const k = recordKey(a);
    if (!keys.has(k)) return;
    if (!joined.has(k) || (a.reviewed_at || '') >= (joined.get(k).reviewed_at || '')) joined.set(k, a);
  });
  const reviews = [...joined.values()];
  $('#assessment-coverage').textContent = `${reviews.length} reviewed · ${Math.max(0, keys.size - reviews.length)} unreviewed model/org pairs`;
  const recommendation = $('#recommendation-filter').value;
  const search = $('#assessment-search').value.toLowerCase().trim();
  const rank = { 'Test now': 0, 'Watch': 1, 'Low priority': 2 };
  const decision = $('#signal-filter').value;
  const onlyNew = $('#only-new').checked;
  const filtered = reviews.filter(a => {
    const s=signalFor(a), m=matchStack(a);
    const isNew=state.releases.some(r=>recordKey(r)===recordKey(a)&&String(r.is_new).toUpperCase()==='TRUE');
    const signalMatches=decision==='all'||(decision==='capability'&&s?.capability_flag==='Capability candidate')||(decision==='cost'&&s?.cost_flag==='Cost hypothesis')||(decision==='estate'&&['exact','provider'].includes(m.kind))||(decision==='unknown'&&m.kind==='unknown');
    return signalMatches&&(!onlyNew||isNew)&&(recommendation==='All reviewed'||a.recommendation===recommendation)&&(!search||Object.values(a).join(' ').toLowerCase().includes(search));
  });
  filtered.sort((a, b) => (rank[a.recommendation] ?? 3) - (rank[b.recommendation] ?? 3) || (b.reviewed_at || '').localeCompare(a.reviewed_at || ''));
  $('#assessment-status').textContent = state.assessmentError || (filtered.length ? `${filtered.length} review${filtered.length === 1 ? '' : 's'} shown. Recommendations are desk reviews; test status is listed on each.` : 'No matching reviews. Change the filters or browse All releases for unreviewed models.');
  $('#assessment-list').innerHTML = filtered.map(a => {
    const tag = a.recommendation === 'Test now' ? 'test' : a.recommendation === 'Watch' ? 'watch' : 'low';
    const urls = (a.source_urls || '').split('|').map(s => safeUrl(s.trim())).filter(Boolean);
    const sources = urls.map(url => `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(new URL(url).hostname)}</a>`).join(' · ');
    return `<article class="assessment">
      <div class="review-top"><span class="recommendation ${tag}">${escapeHtml(a.recommendation || 'Unreviewed')}</span><span class="test-status">${escapeHtml(a.test_status || 'Not tested')}</span><span class="review-date">Reviewed ${escapeHtml(a.reviewed_at || 'Unknown')}</span></div>
      <h3>${escapeHtml(a.name)} <span>${escapeHtml(a.org)}</span></h3>
      ${decisionBadges(a)}
      <p class="workflow">${escapeHtml(a.workflow || 'Workflow not specified')}</p>
      <p>${escapeHtml(a.why || 'Rationale pending.')}</p>
      <div class="review-summary"><div><h4>Evidence & limitations</h4><p>${escapeHtml(a.caveats || 'Unknown')}</p><p class="muted">${escapeHtml(a.evidence || 'Evidence not assessed')} ${sources}</p></div>
      <div><h4>Next step</h4><p>${escapeHtml(a.next_test || 'No test proposed.')}</p></div></div>
      <details><summary>Access, economics & integration</summary><dl>${[['Access','access'],['License','license'],['Cost','cost'],['Latency','latency'],['Quality','quality'],['Integration','integration']].map(([label, field]) => `<div><dt>${label}</dt><dd>${escapeHtml(a[field] || 'Unknown')}</dd></div>`).join('')}</dl><p>Evidence for factual details: ${sources || 'No source supplied'}. Workflow fit and effort are review judgments, not measured results.</p></details>
    </article>`;
  }).join('');
}

$('#reload').addEventListener('click', load);
$('#recommendation-filter').addEventListener('change', renderAssessments);
$('#assessment-search').addEventListener('input', renderAssessments);
$('#signal-filter').addEventListener('change', renderAssessments);
$('#only-new').addEventListener('change', renderAssessments);
$$('[data-view]').forEach(btn => btn.addEventListener('click', () => {
  ['usefulness','timeline','changes','stack','cost','sources','versions'].forEach(name=>$('#'+name+'-panel').hidden=btn.dataset.view!==name);
  $$('[data-view]').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
}));
let theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
}
$('#theme-toggle').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
applyTheme();
load();
