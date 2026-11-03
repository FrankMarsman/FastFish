const $=id=>document.getElementById(id);
const engine='fast';
let params={},seed=$('seed').value,revision=0,nextRequestId=0,pending=null;
let paramsReady=false,initializationRandom=false,current=null,currentSeed=seed,view=null,zoom=1;
let displayedRequest=null,drawFrame=null,currentParams=null,morph=null;
const morphSteps=25;
const dialKeys=new Set(['scale_type','pattern_type','tail_type','finlet_type']);
const nodes=new Map(),workers=new Map();
function pendingMetrics(){
 cancelAnimationFrame(drawFrame);drawFrame=null;displayedRequest=null;
 $('drawTime').textContent='Generating…';$('generationTime').textContent='Generating…';
 $('drawSource').textContent='Generated';
}
function finishDraw(job,generationMs){
 cancelAnimationFrame(drawFrame);displayedRequest=job;
 $('drawTime').textContent='Measuring…';$('generationTime').textContent=generationMs.toFixed(1)+' ms';
 $('drawSource').textContent=job.cached?'Cached animation':'Generated';
 // Measure a paint opportunity after this completed drawing, not a newer input.
 drawFrame=requestAnimationFrame(()=>{
  if(displayedRequest!==job||job.revision!==revision)return;
  drawFrame=requestAnimationFrame(()=>{
   if(displayedRequest!==job||job.revision!==revision)return;drawFrame=null;
   $('drawTime').textContent=(performance.now()-job.startedAt).toFixed(1)+' ms';
   if(job.transition)advanceMorph(job);
  });
 });
}
function failDraw(message='GENERATION ERROR · TRY RESET'){
 $('morphProgress').hidden=true;
 if(morph){
  const state=morph;morph=null;params={...state.from};seed=state.seed;$('seed').value=seed;
  showDrawing(state.fromResult,seed,params);sync();updateAvailability();
 }
 cancelAnimationFrame(drawFrame);drawFrame=null;displayedRequest=null;
 $('drawTime').textContent='Unavailable';$('generationTime').textContent='Unavailable';
 $('drawSource').textContent='Generated';
 $('renderState').textContent=message;$('export').disabled=true;
}
const nearest=(c,n)=>c.values.reduce((best,v,i)=>Math.abs(v-n)<Math.abs(c.values[best]-n)?i:best,0);
const format=(c,i)=>c.options?c.options[i]:String(+c.values[i].toFixed(2));
function wireDial(input,c){
 let drag=null;
 input.onpointerdown=e=>{
  if(input.disabled||e.button!==0||e.isPrimary===false)return;
  e.preventDefault();input.focus();input.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};input.classList.add('dragging');
 };
 input.onpointermove=e=>{
  if(!drag||drag.id!==e.pointerId||input.disabled||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)return;
  const rect=input.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;
  if(Math.hypot(dx,dy)<8)return;
  // Zero is the top label; increasing values run clockwise around the dial.
  const angle=(Math.atan2(dx,-dy)+Math.PI*2)%(Math.PI*2);
  change(c,Math.round(angle*c.values.length/(Math.PI*2))%c.values.length);
 };
 const stop=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  drag=null;input.classList.remove('dragging');
  if(input.hasPointerCapture(e.pointerId))input.releasePointerCapture(e.pointerId);
 };
 for(const event of ['pointerup','pointercancel','lostpointercapture'])input.addEventListener(event,stop);
 input.onkeydown=e=>{
  if(input.disabled)return;
  const current=nearest(c,params[c.key]),count=c.values.length;
  const keys={ArrowRight:(current+1)%count,ArrowUp:(current+1)%count,ArrowLeft:(current+count-1)%count,ArrowDown:(current+count-1)%count,Home:0,End:count-1};
  if(Object.hasOwn(keys,e.key)){e.preventDefault();change(c,keys[e.key]);}
 };
}
groups.forEach(([id,title])=>{
 const module=document.createElement('section');module.className='module';module.setAttribute('aria-label',title);
 const h=document.createElement('h2');h.textContent=title;const number=document.createElement('span');number.textContent=String(groups.findIndex(g=>g[0]===id)+1).padStart(2,'0');h.append(number);module.append(h);
 controls.filter(c=>c.group===id).forEach(c=>{
  const row=document.createElement('div');row.className='control'+(c.toggle?' toggle-row':dialKeys.has(c.key)?' dial-row':'');row.dataset.parameter=c.key;
  const top=document.createElement('div');top.className='control-top';const buttons=[];
  const label=document.createElement('label');label.textContent=c.label;label.htmlFor=c.key;
  const out=document.createElement('output');out.htmlFor=c.key;top.append(label,out);row.append(top);
  let input,knob,choices=[];
  if(c.toggle){input=document.createElement('button');input.className='switch';input.setAttribute('role','switch');input.setAttribute('aria-label',title+': '+c.label);input.onclick=()=>change(c,params[c.key]===0?1:0);row.append(input);}
  else if(dialKeys.has(c.key)){
   const wrap=document.createElement('div');wrap.className='dial-wrap';
   input=document.createElement('button');input.type='button';input.className='dial-knob';input.setAttribute('role','slider');input.setAttribute('aria-label',title+': '+c.label);
   input.setAttribute('aria-valuemin','0');input.setAttribute('aria-valuemax',String(c.values.length-1));input.setAttribute('aria-describedby','dialHelp');
   wireDial(input,c);knob=input;wrap.append(knob);
   c.options.forEach((name,i)=>{
    const optionButton=document.createElement('button');optionButton.className='dial-choice';optionButton.textContent=name;
    const angle=i*2*Math.PI/c.options.length;
    optionButton.style.setProperty('--x',(50+32*Math.sin(angle))+'%');optionButton.style.setProperty('--y',(50-38*Math.cos(angle))+'%');
    optionButton.setAttribute('aria-label',title+': '+c.label+' — '+name);optionButton.setAttribute('aria-pressed','false');
    optionButton.onclick=()=>change(c,i);optionButton.disabled=true;buttons.push(optionButton);choices.push(optionButton);wrap.append(optionButton);
   });
   row.append(wrap);
  }
  else {
   const wrap=document.createElement('div');wrap.className='slider-wrap';
   input=document.createElement('input');input.type='range';input.className='slider';input.min=0;input.max=c.values.length-1;input.step=1;input.setAttribute('aria-label',title+': '+c.label);
   input.oninput=()=>change(c,+input.value);
   for(const dir of [-1,1]){const b=document.createElement('button');b.className='nudge';b.textContent=dir<0?'−':'+';b.setAttribute('aria-label',(dir<0?'Decrease ':'Increase ')+title+' '+c.label);b.onclick=()=>change(c,nearest(c,params[c.key])+dir);b.disabled=true;buttons.push(b);wrap.append(b);if(dir<0)wrap.append(input);}
   row.append(wrap);
  }
  input.id=c.key;input.disabled=true;nodes.set(c.key,{row,input,out,buttons,knob,choices});module.append(row);
 });
 $(['body','dorsal','pelvic'].includes(id)?'left':id==='head'?'right':'lower').append(module);
});
function sync(){controls.forEach(c=>{const n=nodes.get(c.key),i=nearest(c,params[c.key]);n.out.value=format(c,i);if(c.toggle)n.input.setAttribute('aria-checked',String(i===1));else{n.input.value=String(i);n.input.setAttribute('aria-valuetext',format(c,i));if(dialKeys.has(c.key)){n.input.setAttribute('aria-valuenow',String(i));n.knob.style.setProperty('--dial-angle',(i*360/c.values.length)+'deg');n.choices.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===i)));}else{n.input.style.setProperty('--fill',i/(c.values.length-1)*100+'%');}}});}
function enableControls(enabled){for(const n of nodes.values()){n.input.disabled=!enabled;for(const b of n.buttons)b.disabled=!enabled;}}
function updateAvailability(){
 const locked=!!morph;enableControls(paramsReady&&!locked);
 $('random').disabled=locked||!paramsReady||!current;
 for(const id of ['reset','seed'])$(id).disabled=locked;
 $('fish').setAttribute('aria-busy',String(locked));
}
function snapped(values){return Object.fromEntries(controls.map(c=>[c.key,c.values[nearest(c,values[c.key])]]));}
function interpolateParams(from,to,step){
 if(step===morphSteps)return {...to};
 const t=step/morphSteps;
 return Object.fromEntries(controls.map(c=>{
  const value=from[c.key]+(to[c.key]-from[c.key])*t;
  return [c.key,c.options||c.integer?Math.round(value):value];
 }));
}
function queueMorphFrame(state){
 if(morph!==state||state.revision!==revision)return;
 const step=++state.step;
 pending={id:++nextRequestId,revision,engine,action:'render',seed:state.seed,
  params:interpolateParams(state.from,state.target,step),startedAt:step===1?state.startedAt:performance.now(),transition:state,step};
 $('renderState').textContent='PREPARING · '+(step-1)+'/'+morphSteps;pump();
}
function cacheMorphFrame(result,job,generationMs){
 const state=morph;if(!state||job.transition!==state)return;
 state.frames.push({result,job,generationMs});
 $('morphBar').value=state.frames.length;$('morphCount').textContent=state.frames.length+'/'+morphSteps;
 if(job.step<morphSteps){queueMorphFrame(state);return;}
 state.phase='playing';state.playIndex=0;$('renderState').textContent='READY · PLAYING';
 // Let the completed progress bar paint before showing the first cached frame.
 drawFrame=requestAnimationFrame(()=>{
  if(morph!==state)return;
  drawFrame=requestAnimationFrame(()=>{if(morph===state)playMorphFrame(state);});
 });
}
function playMorphFrame(state){
 const frame=state.frames[state.playIndex++];
 display(frame.result,{...frame.job,startedAt:performance.now(),cached:true},frame.generationMs);
}
function advanceMorph(job){
 const state=morph;if(!state||job.transition!==state)return;
 if(state.playIndex<morphSteps){playMorphFrame(state);return;}
 params={...state.target};seed=state.seed;$('seed').value=seed;morph=null;state.frames=[];
 $('morphProgress').hidden=true;
 sync();updateAvailability();$('renderState').textContent='LIVE PREVIEW';$('export').disabled=false;
}
function newFish(){
 if(morph||!paramsReady||!current)return;
 const startedAt=performance.now(),from={...currentParams},fromResult=current,stableSeed=currentSeed;
 invalidateWork();
 const state={revision,from,fromResult,seed:stableSeed,startedAt,step:0,target:null,frames:[],phase:'preparing',playIndex:0};morph=state;
 updateAvailability();pendingMetrics();$('export').disabled=true;$('renderState').textContent='PREPARING MORPH…';
 $('morphProgress').hidden=false;$('morphBar').value=0;$('morphCount').textContent='0/'+morphSteps;
 // A fresh seed selects random target settings. The drawing seed stays fixed
 // throughout the transition and at its endpoint to avoid a random-seed jump.
 pending={id:++nextRequestId,revision,engine,action:'params',seed:'Fish '+Math.random().toString(36).slice(2,9),random:true,startedAt,transition:state};pump();
}
function invalidateWork(){
 $('morphProgress').hidden=true;
 revision++;pending=null;morph=null;cancelAnimationFrame(drawFrame);drawFrame=null;displayedRequest=null;
 // Reuse the idle Fast worker. A synchronous drawing already in progress
 // cannot be interrupted, so discard its worker when cancelling that request.
 for(const [name,slot] of workers){if(slot.job){slot.worker.terminate();workers.delete(name);}}
 updateAvailability();
}
function workerFor(name){
 if(workers.has(name))return workers.get(name);
 const worker=createFishWorker(name),slot={worker,engine:name,job:null};workers.set(name,slot);
 worker.onmessage=({data})=>{
  if(workers.get(name)!==slot)return;
  const job=slot.job;
  if(!job||data.id!==job.id||data.engine!==name)return;
  slot.job=null;
  if(job.revision!==revision||job.engine!==engine){pump();return;}
  if(data.error){if(job.transition||!pending)failDraw('COULD NOT DRAW · TRY RESET OR ADJUST A VALUE');pump();return;}
  if(job.action==='params'){
   if(job.transition){
    if(morph!==job.transition)return;
    morph.target=snapped(data.params);
    for(const c of controls)if(c.options)morph.target[c.key]=morph.from[c.key];
    queueMorphFrame(morph);
   }else{
    params=snapped(data.params);
    paramsReady=true;sync();updateAvailability();requestRender(job.startedAt);
   }
  }else{
   // Completed frames remain useful during a drag even if a newer input waits.
   // There is only one running request and one replaceable pending request.
   if(job.transition)cacheMorphFrame(data.result,job,data.generationMs);
   else display(data.result,job,data.generationMs);
  }
  pump();
 };
 worker.onerror=()=>{
  if(workers.get(name)!==slot)return;
  const job=slot.job;worker.terminate();workers.delete(name);
  if(job&&job.revision===revision&&job.engine===engine){if(pending)pump();else failDraw();}
 };
 return slot;
}
function pump(){
 if(!pending)return;
 const job=pending;
 if(job.revision!==revision||job.engine!==engine){pending=null;return;}
 try{
  const slot=workerFor(engine);if(slot.job)return;
  pending=null;slot.job=job;
  slot.worker.postMessage({id:job.id,engine:job.engine,action:job.action,seed:job.seed,random:job.random,params:job.params});
 }catch{
  const slot=workers.get(engine);slot?.worker.terminate();workers.delete(engine);pending=null;failDraw();
 }
}
function requestRender(startedAt=performance.now()){
 if(!paramsReady||morph)return;
 pending={id:++nextRequestId,revision,engine,action:'render',seed,params:{...params},startedAt};
 $('renderState').textContent='GENERATING…';$('export').disabled=true;pump();
}
function change(c,index){
 const startedAt=performance.now();if(!paramsReady||morph)return;
 const i=Math.max(0,Math.min(c.values.length-1,index));if(params[c.key]===c.values[i])return;
 params[c.key]=c.values[i];sync();requestRender(startedAt);
}
function showDrawing(result,fishSeed,settings){
 current=result;currentSeed=fishSeed;currentParams={...settings};zoom=1;view=[...result.box];applyView();
 $('fish').firstElementChild.setAttribute('d',result.d);
 $('lineCount').textContent=result.lines.toLocaleString()+' LINES';
}
function display(result,job,generationMs){
 showDrawing(result,job.seed,job.params);
 $('renderState').textContent=job.transition?'MORPHING · '+job.step+'/'+morphSteps:pending?'LIVE · UPDATING':'LIVE PREVIEW';
 $('export').disabled=!!morph;updateAvailability();
 finishDraw(job,generationMs);
}
function applyView(){$('fish').setAttribute('viewBox',view.join(' '));}
function initialize(random=false,startedAt=performance.now()){
 invalidateWork();pendingMetrics();paramsReady=false;initializationRandom=random;updateAvailability();
 $('export').disabled=true;$('renderState').textContent='INITIALIZING';
 pending={id:++nextRequestId,revision,engine,action:'params',seed,random,startedAt};pump();
}
$('random').onclick=newFish;
$('reset').onclick=()=>{if(!morph)initialize(false);};
$('seed').addEventListener('change',()=>{
 if(morph)return;
 const startedAt=performance.now();seed=$('seed').value.trim()||'Franky fishus';$('seed').value=seed;
 if(!paramsReady){initialize(initializationRandom,startedAt);return;}
 invalidateWork();pendingMetrics();requestRender(startedAt);
});
function zoomBy(factor){if(!current)return;const next=Math.max(1,Math.min(8,zoom*factor)),r=zoom/next;view=[view[0]+view[2]*(1-r)/2,view[1]+view[3]*(1-r)/2,view[2]*r,view[3]*r];zoom=next;if(zoom===1)view=[...current.box];applyView();}
$('zoomIn').onclick=()=>zoomBy(1.3);$('zoomOut').onclick=()=>zoomBy(1/1.3);$('fit').onclick=()=>{if(current){zoom=1;view=[...current.box];applyView();}};
$('fish').addEventListener('wheel',e=>{if(!current)return;e.preventDefault();zoomBy(e.deltaY<0?1.1:1/1.1);},{passive:false});
const pointers=new Map();let pinchDistance=0;
$('fish').onpointerdown=e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);$('fish').setPointerCapture(e.pointerId);if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);}};
$('fish').onpointermove=e=>{if(!pointers.has(e.pointerId)||!current)return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchDistance)zoomBy(d/pinchDistance);pinchDistance=d;}else if(zoom>1){const r=$('fish').getBoundingClientRect(),scale=Math.max(view[2]/(r.width-40),view[3]/(r.height-82));view[0]-=(e.clientX-prev[0])*scale;view[1]-=(e.clientY-prev[1])*scale;applyView();}};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fish').addEventListener(event,e=>{pointers.delete(e.pointerId);pinchDistance=0;});
$('export').onclick=()=>{if(!current)return;const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+current.box.join(' ')+'"><path fill="none" stroke="#24464d" stroke-width=".7" stroke-linejoin="round" stroke-linecap="round" d="'+current.d+'"/></svg>',url=URL.createObjectURL(new Blob([s],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download='frank-fish-'+currentSeed.replace(/[^a-z0-9]+/gi,'-')+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('renderState').textContent='FULLSCREEN UNAVAILABLE';}};
window.addEventListener('pagehide',()=>{invalidateWork();for(const slot of workers.values())slot.worker.terminate();workers.clear();});
initialize();
