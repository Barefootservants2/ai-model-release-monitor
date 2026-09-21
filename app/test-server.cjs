const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {server}=require('./server.cjs');
const nativeFetch=global.fetch;
let calls=0;
const ready=new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const call=async(route,options={})=>{await ready;return nativeFetch(`http://127.0.0.1:${server.address().port}${route}`,options);};
after(()=>{global.fetch=nativeFetch;server.close();});
test('health endpoint identifies read-only mode',async()=>assert.equal((await(await call('/api/health')).json()).mode,'public-read-only'));
test('HEAD rejection terminates cleanly',async()=>{const r=await call('/api/health',{method:'HEAD'});assert.equal(r.status,405);assert.equal(r.headers.get('content-length'),'0');});
test('mutating methods refused',async()=>{for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await call('/api/feeds/releases',{method})).status,405);});
test('unapproved feed refused',async()=>assert.equal((await call('/api/feeds/private')).status,400));
test('arbitrary source query refused',async()=>assert.equal((await call('/api/feeds/releases?url=http://127.0.0.1')).status,400));
test('unapproved files and paths refused',async()=>{for(const route of ['/server.cjs','/.env','/private-estate-profile.json','/../private-estate-profile.json'])assert.equal((await call(route)).status,404);});
test('public CSV cached without credentials and with exposed timestamps',async()=>{
 global.fetch=async(url,options)=>{calls++;assert.ok(String(url).startsWith('https://docs.google.com/spreadsheets/d/'));assert.equal(options.redirect,'error');assert.equal(options.headers,undefined);return new Response('name,org\nSynthetic,Example',{headers:{'Content-Type':'text/csv'}});};
 const a=await call('/api/feeds/releases'),b=await call('/api/feeds/releases');
 assert.equal(a.status,200);assert.equal(b.headers.get('x-feed-cache'),'hit');assert.equal(calls,1);assert.equal(a.headers.get('access-control-allow-origin'),'*');assert.ok(a.headers.get('x-feed-fetched-at'));
});
test('parallel same-feed requests coalesce',async()=>{
 calls=0;global.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,30));return new Response('key,value\nx,y',{headers:{'Content-Type':'text/csv'}});};
 const results=await Promise.all([call('/api/feeds/meta'),call('/api/feeds/meta'),call('/api/feeds/meta')]);
 assert.ok(results.every(r=>r.status===200));assert.equal(calls,1);
});
test('HTML disguised as CSV refused',async()=>{global.fetch=async()=>new Response('<html>login</html>',{headers:{'Content-Type':'text/csv'}});assert.equal((await call('/api/feeds/signals')).status,502);});
test('wrong content type refused',async()=>{global.fetch=async()=>new Response('x,y',{headers:{'Content-Type':'text/html'}});assert.equal((await call('/api/feeds/events')).status,502);});
test('oversize feed refused',async()=>{global.fetch=async()=>new Response('x'.repeat(2*1024*1024+1),{headers:{'Content-Type':'text/csv'}});assert.equal((await call('/api/feeds/sources')).status,502);});
test('upstream exceptions do not reveal internals',async()=>{global.fetch=async()=>{throw Error('synthetic-private-details');};const r=await call('/api/feeds/versions');assert.equal(r.status,502);assert.ok(!(await r.text()).includes('synthetic-private-details'));});
test('global request budget refuses excess with retry hint',async()=>{let limited=false;for(let i=0;i<620;i++){const r=await call('/api/health');if(r.status===429){assert.equal(r.headers.get('retry-after'),'60');limited=true;break;}}assert.ok(limited);});
