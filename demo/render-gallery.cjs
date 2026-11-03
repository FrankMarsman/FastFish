// Rebuild the animated samples from actual Fast generator output.
// Requires @resvg/resvg-js@2.6.2 and FFmpeg. No browser or network needed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {Resvg}=require('@resvg/resvg-js');
const {workerSources}=require('./build.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'samples');
const contact=process.argv[2]?path.resolve(process.argv[2]):null;
fs.mkdirSync(out,{recursive:true});if(contact)fs.mkdirSync(contact,{recursive:true});
const controls=new Function(fs.readFileSync(path.join(__dirname,'src/controls.js'),'utf8')+';return controls;')();
let response;
const send=new Function('module','require','postMessage','performance','let onmessage;\n'+workerSources().fast+';return data=>onmessage({data});')(undefined,undefined,data=>response=data,performance);
function request(data){send({engine:'fast',id:1,...data});if(response.error)throw Error(response.error);return response;}
function snap(params){return Object.fromEntries(controls.map(c=>[c.key,c.values.reduce((best,v)=>Math.abs(v-params[c.key])<Math.abs(best-params[c.key])?v:best)]));}
function interpolate(from,to,step){if(step===25)return {...to};return Object.fromEntries(controls.map(c=>{const value=from[c.key]+(to[c.key]-from[c.key])*step/25;return[c.key,c.options||c.integer?Math.round(value):value];}));}
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const scaleNames=['Fine scales','Layered scales','Crosshatch','Linear'],patternNames=['Plain','Spots','Mottled','Stripes','Speckles'];
const manifest={schemaVersion:1,generator:'FishDraw_Fast.js',generatorSHA256:hash(fs.readFileSync(path.join(root,'FishDraw_Fast.js'))),width:480,height:300,steps:25,fps:20,endpointHoldFrames:12,description:'Twenty distinct pairs, covering all four scale styles and five patterns. Each loop holds its seed and categories fixed, interpolates numeric parameters, then reverses the same frames. A shared camera encloses every frame. Playback omits preparation and is not a speed benchmark.',samples:[]};
const endpointHashes=new Set();
for(let i=0;i<20;i++){
 const number=String(i+1).padStart(2,'0'),scale=i%4,pattern=Math.floor(i/4),seed='FrankFish gallery '+number;
 const randomFrom=request({action:'params',random:true,seed:seed+' / from'}).params;
 const randomTo=request({action:'params',random:true,seed:seed+' / to'}).params;
 const from=snap({...randomFrom,scale_type:scale,pattern_type:pattern,tail_type:(i*5+1)%6,finlet_type:i%4,
  body_length:[350,285,390,250,330][pattern],body_height:[64,85,110,70,98][(pattern+scale)%5],body_curve_amount:.58+(i%5)*.075,
  wing_length:80+(i*17)%120,wing_width:9+(i*3)%22,dorsal_length:40+(i*13)%120,tail_length:80+(i*7)%60,
  scale_scale:1.05+(i%4)*.1,pattern_scale:.9+(i%3)*.2,nose_height:-20+(i*11)%36,eye_size:9+(i*5)%12,
  has_moustache:i%7===0?1:0,has_beard:i%11===0?1:0,has_teeth:i%3===0?1:0});
 const to=snap({...randomTo,body_length:[235,400,275,380,245][pattern],body_height:[130,55,70,140,60][(pattern+scale)%5],
  wing_length:80+(i*31)%180,wing_width:12+(i*7)%26,dorsal_length:50+(i*23)%100,tail_length:65+(i*19)%90,
  scale_scale:1.05+((i+1)%4)*.1,pattern_scale:1.15+((i+1)%3)*.15,nose_height:-35+(i*7)%60,eye_size:9+(i*3)%16});
 // Keep categorical switches and dials fixed within a pair to avoid abrupt style changes.
 for(const c of controls)if(c.options)to[c.key]=from[c.key];
 assert(Object.values(from).every(Number.isFinite));assert(Object.values(to).every(Number.isFinite));
 const frames=Array.from({length:26},(_,step)=>request({action:'render',seed,params:interpolate(from,to,step)}).result);
 const geometryHashes=frames.map(f=>hash(f.d));assert.equal(new Set(geometryHashes).size,26,'Every morph step must change the fish');
 for(const h of [geometryHashes[0],geometryHashes.at(-1)]){assert(!endpointHashes.has(h),'Duplicate sample');endpointHashes.add(h);}
 const x0=Math.min(...frames.map(f=>f.box[0])),y0=Math.min(...frames.map(f=>f.box[1]));
 const x1=Math.max(...frames.map(f=>f.box[0]+f.box[2])),y1=Math.max(...frames.map(f=>f.box[1]+f.box[3]));
 const viewBox=[x0,y0,x1-x0,y1-y0];assert(viewBox.every(Number.isFinite));
 const pngs=frames.map(f=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="${viewBox.join(' ')}"><path d="${f.d}" fill="none" stroke="#174b52" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,{background:'#eff6f2',font:{loadSystemFonts:false}}).render().asPng());
 const sequence=[...Array(12).fill(0),...Array.from({length:25},(_,j)=>j+1),...Array(12).fill(25),...Array.from({length:24},(_,j)=>24-j)];
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frankfish-gallery-')),file='morph-'+number+'.gif';
 try{
  sequence.forEach((frame,j)=>fs.writeFileSync(path.join(tmp,String(j).padStart(3,'0')+'.png'),pngs[frame]));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','20','-i',path.join(tmp,'%03d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=16[p];[b][p]paletteuse=dither=none','-loop','0',path.join(out,file)]);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 if(contact){fs.writeFileSync(path.join(contact,number+'-start.png'),pngs[0]);fs.writeFileSync(path.join(contact,number+'-end.png'),pngs[25]);}
 const bytes=fs.statSync(path.join(out,file)).size;
 manifest.samples.push({file,title:scaleNames[scale]+' · '+patternNames[pattern],seed,from,to,viewBox,geometryHashes,bytes,sha256:hash(fs.readFileSync(path.join(out,file)))});
 console.log(number+'/20: '+scaleNames[scale]+' / '+patternNames[pattern]+' — '+Math.round(bytes/1024)+' KB');
}
assert.equal(manifest.samples.length,20);assert.equal(endpointHashes.size,40);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated 20 GIFs from 520 validated, distinct fish frames.');
