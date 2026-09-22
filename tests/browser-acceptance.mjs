// Repeatable producer acceptance. Synthetic feed fixtures never write the tracker.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TEST_URL || 'http://127.0.0.1:5000';
const output = process.env.TEST_OUTPUT || new URL('../test-output/browser',import.meta.url).pathname;
await fs.mkdir(output, { recursive: true });
const snapshot = JSON.parse(await fs.readFile(new URL('../app/snapshot.json', import.meta.url)));
const browser = await chromium.launch({ headless: true });
const results = [];
const csv = rows => {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const quote = x => `"${String(x ?? '').replaceAll('"','""')}"`;
  return [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\n');
};
async function check(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (e) { results.push({ name, passed: false, error: e.message }); }
}
async function open(overrides = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/api/feeds/*', async route => {
    const tab = new URL(route.request().url()).pathname.split('/').at(-1);
    if (overrides[tab] === 'fail') return route.fulfill({ status: 502, body: 'Unavailable' });
    if (overrides[tab]?.raw !== undefined) return route.fulfill({ status:200,contentType:'text/csv',body:overrides[tab].raw });
    const rows = overrides[tab] || (tab === 'meta' ? [
      { key: 'last_run', value: new Date(Date.now()-60000).toISOString() },
      { key: 'next_run_label', value: 'Schedule unverified' }
    ] : snapshot[tab]);
    await route.fulfill({ status: 200, contentType: 'text/csv',
      headers: { 'X-Feed-Fetched-At': new Date().toISOString() }, body: csv(rows) });
  });
  if (overrides.snapshot === 'fail') await context.route('**/snapshot.json', r => r.fulfill({ status:404,body:'Unavailable' }));
  else if (overrides.snapshot) await context.route('**/snapshot.json', r => r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(overrides.snapshot)}));
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('#reload').disabled);
  return { context, page };
}
const { context, page } = await open();
const views = ['usefulness','timeline','changes','stack','cost','sources','versions'];
await check('seven valid fixture feeds connect', async () => assert.match(await page.locator('#status-label').innerText(), /Live public feeds connected/));
await check('populated record count excludes blanks', async () => assert.equal(Number(await page.locator('#stat-total').innerText()), snapshot.releases.filter(x=>x.name&&x.org).length));
for (const width of [1440,375]) {
  await page.setViewportSize({ width, height: 900 });
  for (const view of views) await check(`${view} visible and no page overflow at ${width}px`, async () => {
    await page.locator(`[data-view="${view}"]`).click();
    assert.equal(await page.locator(`#${view}-panel`).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output,`${view}-${width}.png`), fullPage: true });
  });
}
await page.setViewportSize({width:1440,height:1000});
await page.locator('[data-view="timeline"]').click();
await check('release search and empty-state recovery', async () => {
  await page.locator('#search').fill('no-such-fixture-xyz');
  assert.equal(await page.locator('#empty-msg').isVisible(), true);
  await page.locator('#search').fill('');
  assert.ok(await page.locator('#releases-body tr').count() > 0);
});
await check('category and license filters cycle', async () => {
  await page.locator('#category-filters button').nth(1).click();
  assert.ok(await page.locator('#releases-body tr').count() > 0);
  await page.locator('#category-filters button').first().click();
  await page.locator('#license-filters button').nth(1).click();
  await page.locator('#license-filters button').first().click();
  assert.equal(await page.locator('#releases-body tr').count(),snapshot.releases.length);
});
await check('keyboard sorting changes and reverses', async () => {
  const button=page.locator('th[data-sort="name"] button');await button.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('th[data-sort="name"]').getAttribute('aria-sort'),'ascending');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('th[data-sort="name"]').getAttribute('aria-sort'),'descending');
});
await check('theme toggle reverses',async()=>{
  const initial=await page.locator('html').getAttribute('data-theme');
  await page.locator('#theme-toggle').click();assert.notEqual(await page.locator('html').getAttribute('data-theme'),initial);
  await page.screenshot({path:path.join(output,'alternate-theme.png'),fullPage:true});
  await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),initial);
});
await page.locator('[data-view="usefulness"]').click();
await check('review filters cycle without error',async()=>{
  await page.locator('#recommendation-filter').selectOption('Watch');
  await page.locator('#assessment-search').fill('no-such-review');
  assert.match(await page.locator('#assessment-status').innerText(),/No matching/);
  await page.locator('#assessment-search').fill('');
  await page.locator('#recommendation-filter').selectOption('All reviewed');
  for(const value of ['capability','cost','estate','unknown','all'])await page.locator('#signal-filter').selectOption(value);
  await page.locator('#only-new').check();await page.locator('#only-new').uncheck();
  await page.locator('.methodology summary').first().click();
});
await page.locator('[data-view="changes"]').click();
await check('event filters cycle',async()=>{
  await page.locator('#event-type').selectOption('Patch');
  await page.locator('#event-search').fill('no-such-event');
  assert.match(await page.locator('#event-status').innerText(),/^0 changes/);
  await page.locator('#event-search').fill('');await page.locator('#event-type').selectOption('All types');
});
await page.locator('[data-view="versions"]').click();
await check('version filters and missing-history disclosure',async()=>{
  await page.locator('#version-search').fill('no-such-version');
  assert.match(await page.locator('#version-list').innerText(),/No matching/);
  await page.locator('#version-search').fill('');
  for(const value of ['Free','Standard','Batch','All'])await page.locator('#version-access').selectOption(value);
  assert.match(await page.locator('#version-status').innerText(),/partial/);
});
await page.locator('[data-view="stack"]').click();
const today=new Date().toISOString().slice(0,10);
const product=snapshot.releases.find(r=>r.name&&r.org);
await check('provider picker select/apply/clear',async()=>{
  await page.locator('#stack-panel details summary').click();
  await page.locator('#provider-picker input').first().check();await page.locator('#apply-providers').click();
  assert.match(await page.locator('#profile-status').innerText(),/1 supplied entries/);
  await page.locator('#clear-profile').click();assert.match(await page.locator('#profile-status').innerText(),/No stack profile/);
});
for(const [name,value] of [
  ['invalid JSON','{bad'],
  ['invalid calendar date',JSON.stringify({as_of:'2026-02-30',products:[]})],
  ['future date',JSON.stringify({as_of:'2099-01-01',products:[]})],
  ['oversized profile','x'.repeat(50001)],
  ['invalid product status',JSON.stringify({as_of:today,products:[{org:'Example',status:'invented'}]})]
]) await check(`${name} refused`,async()=>{
  await page.locator('#profile-json').fill(value);await page.locator('#apply-profile').click();
  assert.match(await page.locator('#profile-status').innerText(),/Profile not applied/);
});
await check('profile import, matching and no profile network transmission',async()=>{
  const requests=[];const listener=r=>requests.push(r.url());page.on('request',listener);
  const profile={as_of:today,complete:false,products:[{org:product.org,name:product.name,status:'user-confirmed',version:'fixture'}]};
  await page.locator('#profile-file').setInputFiles({name:'synthetic-profile.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(profile))});
  await page.waitForFunction(()=>document.querySelector('#profile-status').textContent.includes('1 supplied entries'));
  assert.match(await page.locator('#profile-status').innerText(),/1 supplied entries/);
  await page.locator('[data-view="timeline"]').click();await page.locator('#search').fill(product.name);
  assert.match(await page.locator('#releases-body').innerText(),/Exact product listed/);
  assert.deepEqual(requests,[]);page.off('request',listener);
});
await check('clear removes profile and matching',async()=>{
  await page.locator('[data-view="stack"]').click();await page.locator('#clear-profile').click();
  assert.equal(await page.locator('#profile-json').inputValue(),'');
  await page.locator('[data-view="timeline"]').click();assert.match(await page.locator('#releases-body').innerText(),/Estate unknown/);
});
await page.locator('[data-view="cost"]').click();
await check('cost scenario arithmetic and caveat',async()=>{
  await page.locator('#cost-form button').click();
  const text=await page.locator('#cost-result').innerText();
  assert.match(text,/\$80\.00\/month/);assert.match(text,/\$40\.00\/month/);assert.match(text,/not measured savings/);
  await page.locator('[name="migration"]').fill('120');await page.locator('#cost-form button').click();
  assert.match(await page.locator('#cost-result').innerText(),/candidate \$60\.00/);
});
await check('cost overflow refused',async()=>{
  await page.locator('[name="tasks"]').fill('1e308');await page.locator('#cost-form button').click();
  assert.match(await page.locator('#cost-result').innerText(),/exceeds supported/);
});
await check('cost negative values refused by native form validation',async()=>{
  await page.locator('[name="tasks"]').fill('-1');
  assert.equal(await page.locator('#cost-form').evaluate(f=>f.checkValidity()),false);
});
await check('reload clears supplied profile',async()=>{
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-view="stack"]').click();
  assert.match(await page.locator('#profile-status').innerText(),/No profile loaded/);
});
await check('accessibility critical/serious violations absent',async()=>{
  const violations=[];
  for(const view of views){
    await page.locator(`[data-view="${view}"]`).click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    violations.push(...result.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>({view,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
  }
  await fs.writeFile(path.join(output,'accessibility.json'),JSON.stringify(violations,null,2));
  assert.deepEqual(violations,[]);
});
await context.close();
for(const [name,overrides,pattern] of [
  ['stale metadata',{meta:[{key:'last_run',value:'2020-01-01T00:00:00Z'}]},/stale|unknown/i],
  ['future metadata',{meta:[{key:'last_run',value:'2099-01-01T00:00:00Z'}]},/stale|unknown|invalid/i],
  ['missing metadata',{meta:'fail'},/Partial/],
  ['partial optional feed',{versions:'fail'},/Partial/],
  ['dated fallback',{releases:'fail'},/Saved snapshot/],
  ['fully unavailable',{releases:'fail',snapshot:'fail'},/Feed unavailable/],
  ['malformed snapshot',{releases:'fail',snapshot:{captured_at:'2099-01-01',releases:'not-an-array'}},/Feed unavailable/]
  ,['header-only primary feed',{releases:{raw:'name,org\n'}},/Saved snapshot/]
  ,['duplicate CSV headers',{releases:{raw:'name,name,org\none,two,Example'}},/Saved snapshot/]
  ,['unterminated CSV quote',{releases:{raw:'name,org\n"one,Example'}},/Saved snapshot/]
  ,['extra CSV columns',{releases:{raw:'name,org\none,Example,extra'}},/Saved snapshot/]
  ,['blank required record',{releases:[{name:'',org:'Example'}]},/Saved snapshot/]
  ,['mismatched catalog count',{meta:[{key:'last_run',value:new Date().toISOString()},{key:'total_count',value:'999999'}]},/Saved snapshot/]
]){
  await check(`${name} never presents complete live success`,async()=>{
    const s=await open(overrides);try{assert.match(await s.page.locator('#status-label').innerText(),pattern);assert.equal(await s.page.locator('#status-dot').evaluate(e=>e.classList.contains('live')),false);}finally{await s.context.close();}
  });
}
await check('failed refresh replaces previous delivery-success message',async()=>{
  const s=await open();try{
    await s.context.route('**/api/feeds/releases',r=>r.fulfill({status:502,body:'Unavailable'}));
    await s.page.locator('#reload').click();await s.page.waitForFunction(()=>!document.querySelector('#reload').disabled);
    assert.match(await s.page.locator('#status-label').innerText(),/Refresh failed/);
    assert.match(await s.page.locator('#delivery-status').innerText(),/failed|previous|unavailable/i);
  }finally{await s.context.close();}
});
await check('feed XSS and unsafe URL are inert',async()=>{
  const s=await open({releases:[{...product,name:'<img src=x onerror=alert(1)>',url:'javascript:alert(1)'}]});
  try{await s.page.locator('[data-view="timeline"]').click();assert.equal(await s.page.locator('#releases-body img').count(),0);assert.equal(await s.page.locator('#releases-body a[href^="javascript"]').count(),0);assert.match(await s.page.locator('#releases-body').innerText(),/<img/);}finally{await s.context.close();}
});
await check('insecure and credential-bearing feed links are refused',async()=>{
 const s=await open({releases:[{...product,url:'http://example.test/'},{...product,name:'Credential URL',url:'https://user:pass@example.test/'}]});
 try{await s.page.locator('[data-view="timeline"]').click();assert.equal(await s.page.locator('#releases-body a').count(),0);}finally{await s.context.close();}
});
await browser.close();
const report={checked_at:new Date().toISOString(),base,scope:'Synthetic browser acceptance; not live collection or independent review',passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results};
await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
