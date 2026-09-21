// Run with Playwright installed in a separate design workspace.
// Generates typographic promotional assets, not screenshots of unbuilt features.
const fs=require('node:fs');
const path=require('node:path');
const cards=[
 {name:'instagram-01',n:'01 / 04',eyebrow:'AI MODEL RELEASE MONITOR',title:'New is not<br>the same<br>as useful.',body:'A free pilot for better<br>AI tool decisions.',foot:'Evidence links. Visible unknowns.'},
 {name:'instagram-02',n:'02 / 04',eyebrow:'THREE QUESTIONS. NOT ONE SCORE.',title:'What changed?<br>What fits?<br>What costs less?',body:'Keep releases, stack relevance,<br>and cost hypotheses separate.',foot:'A lower token price is not a result.'},
 {name:'instagram-03',n:'03 / 04',eyebrow:'YOUR STACK. YOUR CHOICE.',title:'Browse all.<br>Filter down.<br>Make it yours.',body:'Choose providers, or add an exact-product<br>profile that stays in page memory.<br>The app does not upload your profile.',foot:'No credentials. No account probing.'},
 {name:'instagram-04',n:'04 / 04',eyebrow:'EXPLORE THE FREE PILOT',title:'Check access.<br>Keep history.<br>Question costs.',body:'Partial coverage. Explicit unknowns.<br>No guaranteed savings.',foot:'ai-release-notes.pplx.app'},
 {name:'linkedin-launch',n:'FREE PILOT',eyebrow:'AI MODEL RELEASE MONITOR',title:'What changed.<br>What fits your stack.<br>What might cost less.',body:'Evidence links. Visible unknowns.<br>Better questions before your next AI decision.',foot:'ai-release-notes.pplx.app',wide:true}
];
function html(c){return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#0a1118;color:#f3f4ef;font-family:Arial,sans-serif}.card{width:${c.wide?1200:1080}px;height:${c.wide?630:1350}px;padding:${c.wide?'44px 56px':'72px'};position:relative;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;font-size:${c.wide?14:20}px;font-weight:700;letter-spacing:2px;color:#8fd6e9}.mark{display:inline-block;width:22px;height:22px;border:3px solid #8fd6e9;border-radius:50%;margin-right:14px;vertical-align:middle}.n{color:#a0abb6}
h1{font-size:${c.wide?66:91}px;line-height:1.09;letter-spacing:-4px;margin:${c.wide?'50px 0 24px':'115px 0 48px'};font-weight:600;max-width:${c.wide?'940':'950'}px}
p{font-size:${c.wide?24:34}px;line-height:1.5;color:#bdc9d2;letter-spacing:-.5px;margin:0}.line{height:3px;background:#8fd6e9;width:90px;margin:${c.wide?'25px 0':'64px 0'}}
.bottom{position:absolute;bottom:${c.wide?40:65}px;left:${c.wide?56:72}px;right:${c.wide?56:72}px;border-top:1px solid #34424d;padding-top:24px;display:flex;justify-content:space-between;font-size:${c.wide?15:22}px;color:#bdc9d2}.tag{color:#8fd6e9}
</style></head><body><main class="card"><div class="top"><span><i class="mark"></i>${c.eyebrow}</span><span class="n">${c.n}</span></div><h1>${c.title}</h1><div class="line"></div><p>${c.body}</p><div class="bottom"><span>${c.foot}</span><span class="tag">Ashes2Echoes</span></div></main></body></html>`;}
for(const c of cards)fs.writeFileSync(path.join(__dirname,c.name+'.html'),html(c));
module.exports=cards;
