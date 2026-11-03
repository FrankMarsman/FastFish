const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const baseFile=path.join(__dirname,'baselines/FishDraw_Fast.v1.js');
const candidateFile=path.resolve(process.argv[2]||path.join(__dirname,'candidates/FishDraw_Fast.v2-clipping.js'));
function load(file,prepared){return new Function('module','require',fs.readFileSync(file,'utf8')+';return {clip,clip_multi,seg_isect_poly,binclip,poly_union,'+(prepared?'prepare_clip_edges,':'')+'};')(undefined,undefined);}
const a=load(baseFile,false),b=load(candidateFile,true);
let state=0xBA771E;
const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
let checked=0;
for(const scale of [1e-9,1e-3,1,1e3,1e9])for(let trial=0;trial<80;trial++){
 const n=3+Math.floor(random()*30),offset=(random()-.5)*scale*5;
 const polygon=Array.from({length:n},(_,i)=>{const angle=i/n*Math.PI*2,r=(.3+random())*scale;return[offset+Math.cos(angle)*r,offset+Math.sin(angle)*r];});
 if(trial%2)polygon.reverse();if(trial%7===0)polygon.push(polygon[0]);
 const lines=Array.from({length:6},()=>Array.from({length:2+Math.floor(random()*6)},()=>[offset+(random()-.5)*scale*6,offset+(random()-.5)*scale*6]));
 lines.push([polygon[0],polygon[0],polygon[1]]);
 lines.push([[polygon[0][0]+scale*1e-12,polygon[0][1]],polygon[1]]);
 lines.push([[offset+10*scale,offset+10*scale],[offset+11*scale,offset+11*scale]]);
 const prepared=b.prepare_clip_edges(polygon);
 for(const line of lines){
  assert.deepEqual(b.clip(line,polygon,prepared),a.clip(line,polygon));
  const p=line[0],q=line.at(-1);
  for(const ray of [false,true])assert.deepEqual(b.seg_isect_poly(...p,...q,polygon,ray,prepared),a.seg_isect_poly(...p,...q,polygon,ray));
  checked++;
 }
 assert.deepEqual(b.clip_multi(lines,polygon),a.clip_multi(lines,polygon));
 const predicate=(x,y)=>x+y>offset;
 assert.deepEqual(b.clip_multi(lines,predicate,b.binclip),a.clip_multi(lines,predicate,a.binclip),'Custom clipping path must remain unchanged');
}
for(const polygon of [[],[[0,0]],[[0,0],[1,1]],[[0,0],[NaN,1]],[[Infinity,0],[1,1]]])for(const line of [[],[[0,0]],[[0,0],[1,1]]])assert.deepEqual(b.clip(line,polygon,b.prepare_clip_edges(polygon)),a.clip(line,polygon));
const squares=[[[0,0],[4,0],[4,4],[0,4]],[[2,2],[6,2],[6,6],[2,6]],[[10,10],[11,10],[11,11],[10,11]]];
for(const p of squares)for(const q of squares)assert.deepEqual(b.poly_union(p,q),a.poly_union(p,q));
console.log('PASS',checked,'finite-segment/ray/edge-boundary probes, custom clipping, degenerate inputs and polygon unions');
