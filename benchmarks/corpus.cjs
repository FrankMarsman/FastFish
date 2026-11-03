const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const space=require('./parameter-space.json');
const CORPUS_SEED=0xF15D2026,COUNT=2048;
function buildCorpus(){
 let state=CORPUS_SEED;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
 const rows=[],seen=new Set();
 function add(id,group,params,seed){
  const indices=space.controls.map(c=>c.values.indexOf(params[c.key]));
  if(indices.some(i=>i<0))throw Error('Outside frozen parameter space: '+id);
  const key=indices.join(',');if(seen.has(key))return false;seen.add(key);
  rows.push({id,group,seed,indices,params:{...params}});return true;
 }
 add('default','neighbourhood',space.defaults,space.defaultSeed);
 for(const c of space.controls)for(let i=0;i<c.values.length;i++)add(`one-${c.key}-${i}`,'neighbourhood',{...space.defaults,[c.key]:c.values[i]},space.defaultSeed);
 if(rows.length!==496)throw Error('Expected 496 distinct neighbours');
 for(let scale=0;scale<4;scale++)for(let pattern=0;pattern<5;pattern++)for(let tail=0;tail<6;tail++)for(let body=0;body<2;body++)for(let dorsal=0;dorsal<2;dorsal++){
  const id=`matrix-${scale}-${pattern}-${tail}-${body}-${dorsal}`;
  add(id,'categorical',{...space.defaults,scale_type:scale,pattern_type:pattern,tail_type:tail,body_curve_type:body,dorsal_texture_type:dorsal},'FrankFish corpus v1 '+id);
 }
 for(let i=0;i<64;i++){
  const params=Object.fromEntries(space.controls.map((c,j)=>[c.key,c.values[(((i*(2*j+1))^(i>>((j%5)+1))^(j*17))&1)?c.values.length-1:0]]));
  add('corner-'+i,'boundaries',params,'FrankFish corpus v1 corner '+i);
 }
 const needed=COUNT-rows.length;
 const permutations=space.controls.map(()=>{const a=Array.from({length:needed},(_,i)=>i);for(let i=needed-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});
 for(let i=0;i<needed;i++){
  const params=Object.fromEntries(space.controls.map((c,j)=>[c.key,c.values[Math.floor(permutations[j][i]*c.values.length/needed)]]));
  if(!add('lhs-'+String(i).padStart(4,'0'),'stratified',params,'FrankFish corpus v1 lhs '+i))throw Error('Duplicate stratified configuration');
 }
 const packed={schemaVersion:1,seed:CORPUS_SEED,count:COUNT,parameterSpaceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'parameter-space.json'))).digest('hex'),controls:space.controls.map(c=>c.key),cases:rows.map(({params,...rest})=>rest)};
 const canonical=JSON.stringify(packed)+'\n';
 const sha256=crypto.createHash('sha256').update(canonical).digest('hex');
 return {space,cases:rows,packed,canonical,sha256};
}
if(require.main===module){const c=buildCorpus();if(process.argv[2])fs.writeFileSync(process.argv[2],c.canonical);else process.stdout.write(c.canonical);}
module.exports={buildCorpus};
