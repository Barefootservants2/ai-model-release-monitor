const {test}=require('node:test');
const assert=require('node:assert/strict');
const v=require('./feed-validation.js');
const {createLimiter}=require('./rate-limit.cjs');
test('CSV preserves quoted commas, linebreaks and escaped quotes',()=>{
 assert.deepEqual(v.objects('name,org\r\n"A, ""B""\nC",Example','releases'),[{name:'A, "B"\nC',org:'Example'}]);
});
test('malformed CSV structures fail closed',()=>{
 for(const csv of ['name,org\n','name,name,org\na,b,c','name,org\n"a,b','name,org\na,b,c','name,org\n"a"tail,b','name,org\na"b",c','name,__proto__,org\na,b,c','name,org\n,Example'])
 assert.throws(()=>v.objects(csv,'releases'));
});
test('duplicate metadata keys fail closed',()=>assert.throws(()=>v.objects('key,value\nlast_run,a\nlast_run,b','meta')));
test('known blank Sheet flags are excluded without admitting partial records',()=>{
 assert.deepEqual(v.objects('name,org,is_new\n,,FALSE\nModel,Example,FALSE','releases'),[{name:'Model',org:'Example',is_new:'FALSE'}]);
 assert.throws(()=>v.objects('name,org,is_new\n,,FALSE','releases'));
 assert.throws(()=>v.objects('name,org,is_new\n,Example,FALSE','releases'));
});
test('freshness rejects old, missing, invalid and implausible future timestamps',()=>{
 const now=Date.parse('2026-09-22T20:00:00Z');
 assert.equal(v.fresh('2026-09-22T19:00:00Z',now),true);
 for(const value of ['',undefined,'invalid','2026-09-20T20:00:00Z','2099-01-01T00:00:00Z'])assert.equal(v.fresh(value,now),false);
});
test('malformed snapshot never accepted',()=>{
 for(const value of [null,{}, {captured_at:'2099-01-01',releases:[]},{captured_at:'2020-01-01',releases:'invalid'}])assert.throws(()=>v.snapshot(value));
});
test('independent socket identities cannot consume one another’s quota',()=>{
 const allow=createLimiter({limit:2,maxIdentities:2});
 assert.equal(allow('a',0),true);assert.equal(allow('a',0),true);assert.equal(allow('a',0),false);
 assert.equal(allow('b',0),true);assert.equal(allow('c',0),false);assert.equal(allow('a',60000),true);
});
