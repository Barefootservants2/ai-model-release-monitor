// Shared, dependency-free validation for untrusted public CSV and saved snapshots.
(function(root) {
  'use strict';
  const schemas = {
    releases:['name','org'],meta:['key','value'],assessments:['name','org','recommendation'],
    signals:['name','org','cost_flag'],events:['event_id','event_type'],
    sources:['source_id','url'],versions:['family','version','access_channel']
  };
  function parseCSV(text) {
    const rows=[]; let row=[],field='',quoted=false,closed=false;
    const cell=()=>{row.push(field);field='';closed=false;};
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){
        if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}
        else field+=c;
      }else if(c===','){cell();}
      else if(c==='\n'||c==='\r'){
        if(c==='\r'&&text[i+1]==='\n')i++;
        cell();if(row.some(x=>x!==''))rows.push(row);row=[];
      }else if(c==='"'){
        if(field||closed)throw Error('Malformed CSV quoting');
        quoted=true;
      }else{
        if(closed)throw Error('Content after quoted field');
        field+=c;
      }
    }
    if(quoted)throw Error('Unterminated CSV quote');
    if(field||row.length||closed){cell();if(row.some(x=>x!==''))rows.push(row);}
    return rows;
  }
  function objects(text,tab){
    if(typeof text!=='string'||text.length>2*1024*1024)throw Error('Feed size invalid');
    const rows=parseCSV(text),header=(rows.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,''));
    if(!schemas[tab]||header.length>30||header.some(x=>!x||['__proto__','constructor','prototype'].includes(x))||
      new Set(header).size!==header.length||!schemas[tab].every(x=>header.includes(x)))throw Error('Feed header mismatch');
    if(rows.length>12000||rows.some(r=>r.length!==header.length||r.some(x=>x.length>20000)))throw Error('Feed record shape invalid');
    let result=rows.map(row=>Object.fromEntries(header.map((h,i)=>[h,row[i].trim()])));
    // The shared Sheet has preformatted blank rows with only is_new=FALSE.
    // Ignore only these known placeholders, never partially populated records.
    if(tab==='releases')result=result.filter(r=>!Object.entries(r).every(([k,value])=>!value||(k==='is_new'&&value==='FALSE')));
    if(tab==='releases'&&(!result.length||result.some(r=>!r.name||!r.org)))throw Error('Release records unavailable');
    if(tab!=='meta'&&result.some(r=>!schemas[tab].every(key=>r[key])))throw Error('Required feed field empty');
    if(tab==='meta'&&new Set(result.map(r=>r.key)).size!==result.length)throw Error('Duplicate metadata key');
    return result;
  }
  function fresh(value,now=Date.now()){
    const time=Date.parse(value);
    return Number.isFinite(time)&&time<=now+300000&&now-time<=25*3600000;
  }
  function snapshot(value){
    if(!value||typeof value!=='object'||!Number.isFinite(Date.parse(value.captured_at))||
       Date.parse(value.captured_at)>Date.now()+300000)throw Error('Invalid snapshot date');
    for(const [tab,required] of Object.entries(schemas)){
      if(tab==='meta')continue;
      const records=value[tab];
      if(!Array.isArray(records)||records.length>12000)throw Error('Invalid snapshot records');
      if(records.some(r=>!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length>30||
        Object.values(r).some(v=>typeof v!=='string'||v.length>20000)||
        !required.every(k=>typeof r[k]==='string'&&r[k].trim())))throw Error('Invalid snapshot schema');
    }
    if(!value.releases.length||value.releases.some(r=>!r.name||!r.org))throw Error('Empty snapshot');
    return value;
  }
  const api={parseCSV,objects,fresh,snapshot};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FeedValidation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
