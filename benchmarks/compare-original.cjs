// Drawing calculation only. Run from any directory; no dependencies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadEngine,measure,combine,equivalent,environment}=require('./harness.cjs');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(__dirname,'results/original-vs-fast-v2.json'));
if(fs.existsSync(out))throw Error('Refusing to overwrite an existing result: '+out);
const original=loadEngine(path.join(root,'fishdraw.js')),fast=loadEngine(path.join(root,'FishDraw_Fast.js'));
const controls=new Function(fs.readFileSync(path.join(root,'demo/src/controls.js'),'utf8')+';return controls;')();
const raw=new Function('module','require',fs.readFileSync(path.join(root,'fishdraw.js'),'utf8')+';return default_params();')(undefined,undefined);
const base=Object.fromEntries(controls.map(c=>[c.key,c.values.reduce((best,v)=>Math.abs(v-raw[c.key])<Math.abs(best-raw[c.key])?v:best)]));
const cases=[['Layered scales (Studio defaults)',base],['Fine scales',{...base,scale_type:0}],['Crosshatch',{...base,scale_type:2}],['Linear',{...base,scale_type:3}]];
const report={schemaVersion:1,startedAt:new Date().toISOString(),environment:environment(),metric:'fish(params) only; parameter copying, cleanup, SVG conversion, workers and browser display excluded',seed:'Franky fishus',warmups:3,samples:7,engines:{original:{sha256:original.sha256,gitBlobSha:original.gitBlobSha},fast:{sha256:fast.sha256,gitBlobSha:fast.gitBlobSha}},cases:[]};
for(const [name,params] of cases){
 const c={seed:report.seed,params};
 for(let i=0;i<report.warmups;i++){measure(original,c);measure(fast,c);}
 const runs={original:[],fast:[]};
 for(let i=0;i<report.samples;i++)for(const key of i%2?['fast','original']:['original','fast'])runs[key].push(measure(key==='fast'?fast:original,c));
 const a=combine(runs.original),b=combine(runs.fast);
 assert.equal(a.status,'ok');assert.equal(b.status,'ok');assert(equivalent(a,b),'Exact geometry differs: '+name);
 const result={name,params,original:a,fast:b,speedup:a.medianMs/b.medianMs};report.cases.push(result);
 console.log(JSON.stringify({name,originalMs:a.medianMs,fastMs:b.medianMs,speedup:result.speedup,exactGeometry:true}));
}
report.finishedAt=new Date().toISOString();
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
