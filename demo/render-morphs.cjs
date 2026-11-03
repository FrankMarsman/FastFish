// Optional README media tooling: npm install --no-save @resvg/resvg-js
// Also requires ffmpeg on PATH. The demo itself has no dependencies.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {Resvg}=require('@resvg/resvg-js');
const {workerSources}=require('./build.cjs');
const controls=new Function(fs.readFileSync(path.join(__dirname,'src/controls.js'),'utf8')+';return controls;')();
let response;
const send=new Function('module','require','postMessage','performance','let onmessage;\n'+workerSources().fast+';return data=>onmessage({data});')(undefined,undefined,data=>response=data,performance);
function request(data){send({engine:'fast',id:1,...data});if(response.error)throw Error(response.error);return response;}
function snap(params){return Object.fromEntries(controls.map(c=>[c.key,c.values.reduce((best,v)=>Math.abs(v-params[c.key])<Math.abs(best-params[c.key])?v:best)]));}
function interpolate(from,to,step){return Object.fromEntries(controls.map(c=>{const v=from[c.key]+(to[c.key]-from[c.key])*step/25;return[c.key,c.options||c.integer?Math.round(v):v];}));}
const manifest={generator:'FishDraw_Fast.js',steps:25,playbackFps:20,description:'Actual generated geometry using the Studio interpolation rule. Each loop holds both endpoints and reverses the same frames; preparation time is omitted.',examples:[]};
for(const [name,scale]of [['layered',1],['crosshatch',2]]){
 const seed='Franky fishus';
 const from=snap({...request({action:'params',seed}).params,scale_type:scale,has_moustache:0,has_beard:0});
 const to=snap({...from,body_length:235,body_height:125,body_curve_amount:.62,dorsal_length:155,pelvic_length:50,wing_length:230,wing_width:30,anal_length:35,tail_length:145,nose_height:-25,eye_size:17,head_length:25,jaw_open:.25});
 const frames=Array.from({length:26},(_,step)=>request({action:'render',seed,params:interpolate(from,to,step)}).result);
 const x0=Math.min(...frames.map(f=>f.box[0])),y0=Math.min(...frames.map(f=>f.box[1]));
 const x1=Math.max(...frames.map(f=>f.box[0]+f.box[2])),y1=Math.max(...frames.map(f=>f.box[1]+f.box[3]));
 const box=[x0,y0,x1-x0,y1-y0];
 const pngs=frames.map(f=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="${box.join(' ')}"><path d="${f.d}" fill="none" stroke="#174b52" stroke-width=".65" stroke-linecap="round" stroke-linejoin="round"/></svg>`,{background:'#eff6f2',font:{loadSystemFonts:false}}).render().asPng());
 const sequence=[...Array(12).fill(0),...Array.from({length:25},(_,i)=>i+1),...Array(12).fill(25),...Array.from({length:24},(_,i)=>24-i)];
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frankfish-morph-'));
 try{
  sequence.forEach((frame,i)=>fs.writeFileSync(path.join(tmp,String(i).padStart(3,'0')+'.png'),pngs[frame]));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','20','-i',path.join(tmp,'%03d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=none','-loop','0',path.join(__dirname,'media',name+'-morph.gif')]);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 manifest.examples.push({file:name+'-morph.gif',seed,from,to,viewBox:box});
 console.log('Rendered '+name+' morph: 25 steps, '+sequence.length+' playback frames.');
}
fs.writeFileSync(path.join(__dirname,'media/morphs.json'),JSON.stringify(manifest,null,2)+'\n');
