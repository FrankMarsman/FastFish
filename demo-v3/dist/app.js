'use strict';
const $=id=>document.getElementById(id),canvas=$('sea'),ctx=canvas.getContext('2d');
let worker,revision=0,timer,bitmap=null,failures=0;
function size(){return{width:Math.max(1,innerWidth),height:Math.max(1,innerHeight),top:Math.ceil($('controls').getBoundingClientRect().bottom+12),dpr:Math.min(devicePixelRatio||1,2)};}
function paint(){const s=size();canvas.width=Math.round(s.width*s.dpr);canvas.height=Math.round(s.height*s.dpr);ctx.setTransform(s.dpr,0,0,s.dpr,0,0);ctx.fillStyle='#eff6f2';ctx.fillRect(0,0,s.width,s.height);if(bitmap)ctx.drawImage(bitmap,0,0,s.width,s.height);}
function boot(){worker=new Worker('worker.js');worker.onmessage=({data:d})=>{
 if(d.revision!==revision){d.bitmap?.close();return;}
 if(d.type==='progress'){$('status').textContent=d.text;return;}
 if(d.type==='error'){$('status').textContent=d.message+' Move a slider to retry.';return;}
 if(d.type==='done'){bitmap?.close();bitmap=d.bitmap;paint();$('status').textContent=d.placed===d.target?d.placed.toLocaleString()+' fish · ready':d.placed.toLocaleString()+' / '+d.target.toLocaleString()+' fish placed';failures=0;}
 };worker.onerror=()=>{worker.terminate();worker=null;$('status').textContent='Preparation interrupted. Move a slider to retry.';failures++;};}
function request(){timer=null;if(!worker)boot();const s=size();worker.postMessage({type:'layout',revision,count:+$('count').value,gap:+$('gap').value,...s});}
function schedule(){revision++;worker?.postMessage({type:'cancel',revision});clearTimeout(timer);$('countValue').value=$('count').value;$('gapValue').value=$('gap').value+' px';$('status').textContent='Preparing composition…';timer=setTimeout(request,250);}
for(const id of ['count','gap'])$(id).addEventListener('input',schedule);
addEventListener('resize',()=>{paint();schedule();});
addEventListener('pagehide',()=>{clearTimeout(timer);worker?.terminate();bitmap?.close();});
paint();boot();request();
