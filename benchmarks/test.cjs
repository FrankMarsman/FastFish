const assert=require('node:assert/strict');
const {buildCorpus}=require('./corpus.cjs');
const {fingerprint,combine,equivalent,classify,distribution}=require('./harness.cjs');
const {parse}=require('./run.cjs');
const a=buildCorpus(),b=buildCorpus();assert.equal(a.cases.length,2048);assert.equal(a.sha256,b.sha256);assert.equal(a.canonical,b.canonical);
assert.equal(new Set(a.cases.map(c=>c.indices.join(','))).size,2048);
assert.equal(a.cases.filter(c=>c.group==='neighbourhood').length,496);
for(let j=0;j<a.space.controls.length;j++)assert.equal(new Set(a.cases.map(c=>c.indices[j])).size,a.space.controls[j].values.length);
assert.equal(new Set(a.cases.map(c=>['scale_type','pattern_type','tail_type','body_curve_type','dorsal_texture_type'].map(k=>c.params[k]).join(','))).size,480);
const lhs=a.cases.filter(c=>c.group==='stratified');for(let j=0;j<a.space.controls.length;j++){const counts=a.space.controls[j].values.map((_,i)=>lhs.filter(c=>c.indices[j]===i).length);assert(Math.max(...counts)-Math.min(...counts)<=1);}
assert.throws(()=>fingerprint([[[NaN,0]]]));assert.notEqual(fingerprint([[[0,0]]]).hash,fingerprint([[[-0,0]]]).hash,'Preserve double precision including signed zero');
assert.notEqual(fingerprint([[[1,2],[3,4]]]).hash,fingerprint([[[1,2]],[[3,4]]]).hash,'Preserve polyline boundaries');
const row=combine([{status:'ok',ms:1,hash:'a'},{status:'ok',ms:3,hash:'a'},{status:'ok',ms:2,hash:'a'}]);assert.equal(row.medianMs,2);assert(equivalent(row,row));assert(!combine([{status:'ok',ms:1,hash:'a'},{status:'ok',ms:2,hash:'b'}]).consistent);
assert.equal(classify(10,10.4),'within-threshold');assert.equal(classify(10,11),'regression');assert.equal(classify(1,1.1),'within-threshold');assert.equal(classify(10,8),'improvement');
assert.equal(distribution([1,2,3,4,5]).p95,5);assert.throws(()=>parse(['--mode','other','--out','x']));
console.log(JSON.stringify({passed:true,cases:a.cases.length,groups:a.cases.reduce((m,c)=>(m[c.group]=(m[c.group]||0)+1,m),{}),corpusSha256:a.sha256}));
