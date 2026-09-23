// Public, read-only delivery of a fixed spreadsheet. No credentials or private input.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const fsSync=require('node:fs');
const validation=require('./feed-validation.js');
const {createLimiter}=require('./rate-limit.cjs');
const SHEET='1BNcJ3tfjWyn1awDEeM5Jn5Zqjt_vGwdSmcHMcuZrBbg';
const TABS=new Set(['releases','meta','assessments','signals','events','sources','versions']);
const STATIC=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/intelligence.js','intelligence.js'],['/styles.css','styles.css'],['/snapshot.json','snapshot.json']]);
const cache=new Map(), pending=new Map();
STATIC.set('/feed-validation.js','feed-validation.js');
const publicFiles=['index.html','app.js','intelligence.js','feed-validation.js','styles.css','snapshot.json','server.cjs','rate-limit.cjs'];
const build=crypto.createHash('sha256').update(publicFiles.map(file=>file+':'+crypto.createHash('sha256').update(fsSync.readFileSync(path.join(__dirname,file))).digest('hex')).join('\n')).digest('hex');
const allowRequest=createLimiter();
const MAX_BYTES=2*1024*1024, TTL=60000;
let windowStart=Date.now(),requestCount=0;
async function getFeed(tab) {
  const saved=cache.get(tab);
  if(saved&&Date.now()-saved.time<TTL)return {...saved,cached:true};
  if(pending.has(tab))return pending.get(tab);
  const promise=(async()=>{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv&headers=1&sheet=${tab}`;
    const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!response.ok||!response.headers.get('content-type')?.includes('text/csv'))throw Error('Upstream unavailable');
    let bytes=0;const parts=[];
    for await(const part of response.body){bytes+=part.length;if(bytes>MAX_BYTES)throw Error('Feed size exceeded');parts.push(part);}
    const body=Buffer.concat(parts).toString('utf8');
    if(!body||/^\s*</.test(body))throw Error('Invalid upstream content');
    validation.objects(body,tab);
    const value={body,time:Date.now(),cached:false};
    cache.set(tab,value);return value;
  })();
  pending.set(tab,promise);
  try{return await promise;}finally{pending.delete(tab);}
}
async function handleRequest(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers','X-Feed-Fetched-At, X-Feed-Cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.perplexity.ai https://*.pplx.app; object-src 'none'; base-uri 'none'; form-action 'none'");
  if(req.method==='HEAD'){res.writeHead(405,{Allow:'GET, OPTIONS','Content-Length':'0'});return res.end();}
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(req.method!=='GET'){res.writeHead(405,{Allow:'GET, OPTIONS'});return res.end('Read only');}
  let url;
  try {
    if(typeof req.url!=='string'||!req.url.startsWith('/')||req.url.startsWith('//'))throw Error('Invalid target');
    url=new URL(req.url,'http://localhost');
    if(url.origin!=='http://localhost')throw Error('Invalid origin');
  } catch {
    res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8','Connection':'close'});
    return res.end('Invalid request target');
  }
  if(url.pathname==='/api/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({status:'ok',mode:'public-read-only',cache_seconds:60,build_sha256:build}));}
  const match=url.pathname.match(/^\/api\/feeds\/([a-z]+)$/);
  if(match){
    if(!TABS.has(match[1])||url.search){res.writeHead(400);return res.end('Unsupported feed request');}
    if(Date.now()-windowStart>=60000){windowStart=Date.now();requestCount=0;}
    if(!allowRequest(req.socket.remoteAddress)||++requestCount>6000){res.writeHead(429,{'Retry-After':'60','Content-Length':'0'});return res.end();}
    try{
      const result=await getFeed(match[1]);
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','X-Feed-Fetched-At':new Date(result.time).toISOString(),'X-Feed-Cache':result.cached?'hit':'miss'});
      return res.end(result.body);
    }catch{
      res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});
      return res.end(JSON.stringify({error:'Public feed unavailable. Retry later or use the dated snapshot.'}));
    }
  }
  const file=STATIC.get(url.pathname);
  if(!file){res.writeHead(404);return res.end('Not found');}
  try{
    const body=await fs.readFile(path.join(__dirname,file));
    const ext=path.extname(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[ext]});
    return res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
}
const server=http.createServer((req,res)=>{
  handleRequest(req,res).catch(()=>{
    if(res.headersSent){res.destroy();return;}
    res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8','Connection':'close'});
    res.end('Request failed');
  });
});
server.headersTimeout=10000;
server.requestTimeout=20000;
server.keepAliveTimeout=5000;
server.maxConnections=100;
server.maxRequestsPerSocket=100;
if(require.main===module)server.listen(Number(process.env.PORT)||5000,'0.0.0.0',()=>console.log('Public feed server listening'));
module.exports={server,getFeed,TABS};
