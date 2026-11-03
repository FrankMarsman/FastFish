'use strict';
importScripts('vendor/FishDraw_Fast.js','packing.js');
const library=[];let latest=0,running=false,queued=null;
const pause=()=>new Promise(r=>setTimeout(r,0));
function progress(job,text){if(latest===job.revision)postMessage({type:'progress',revision:job.revision,text});}
function outlinePath(ctx,poly){if(!poly||poly.length<2)return;ctx.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i][0],poly[i][1]);ctx.closePath();}
function linePath(ctx,lines){for(const line of lines){if(!line.length)continue;ctx.moveTo(...line[0]);for(let i=1;i<line.length;i++)ctx.lineTo(...line[i]);}}
function transform(ctx,fish,scale,angle,mirror,x,y){ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.scale(mirror?-scale:scale,scale);ctx.translate(-fish.cx,-fish.cy);}
function silhouetteImage(fish,scale){
 if(fish.silhouette && fish.silhouette.scale>=scale)return fish.silhouette;
 const resolution=Math.min(1,scale*2),padding=4,w=Math.ceil(fish.bounds[2]*resolution)+padding*2,h=Math.ceil(fish.bounds[3]*resolution)+padding*2;
 const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d');
 for(const part of fish.parts){const layer=new OffscreenCanvas(w,h),l=layer.getContext('2d');transform(l,fish,resolution,0,false,w/2,h/2);for(const p of part.fill){l.beginPath();outlinePath(l,p);l.fill();}l.globalCompositeOperation='destination-out';for(const p of part.cut){l.beginPath();outlinePath(l,p);l.fill();}ctx.drawImage(layer,0,0);}
 ctx.save();transform(ctx,fish,resolution,0,false,w/2,h/2);ctx.lineWidth=Math.max(.7,.42/scale)+1/scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();linePath(ctx,fish.lines);ctx.stroke();ctx.restore();
 fish.silhouette={canvas,resolution,scale};return fish.silhouette;
}
function variant(fish,scale,angle,mirror,gap){
 const source=silhouetteImage(fish,scale),a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=fish.bounds[2]*scale,h=fish.bounds[3]*scale;
 const radius=Math.ceil(gap/2+1),pad=radius+3,mw=Math.ceil(Math.abs(c)*w+Math.abs(s)*h)+2*pad,mh=Math.ceil(Math.abs(s)*w+Math.abs(c)*h)+2*pad;
 const canvas=new OffscreenCanvas(mw,mh),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.translate(mw/2,mh/2);ctx.rotate(a);const r=scale/source.resolution;ctx.scale(mirror?-r:r,r);ctx.drawImage(source.canvas,-source.canvas.width/2,-source.canvas.height/2);
 const rgba=ctx.getImageData(0,0,mw,mh).data,raw=new Uint8Array(mw*mh);for(let i=0;i<raw.length;i++)raw[i]=rgba[i*4+3]>0?1:0;
 return{...maskBits(dilation(raw,mw,mh,radius),mw,mh),scale,angle,mirror};
}
// Validate promising placements with actual display-scale strokes, not resampled silhouettes.
function preciseMask(fish,m,gap){
 if(m.precise)return m;
 const canvas=new OffscreenCanvas(m.w,m.h),ctx=canvas.getContext('2d',{willReadFrequently:true});
 transform(ctx,fish,m.scale,m.angle,m.mirror,m.w/2,m.h/2);ctx.lineWidth=Math.max(.7,.42/m.scale);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();linePath(ctx,fish.lines);ctx.stroke();
 const rgba=ctx.getImageData(0,0,m.w,m.h).data,raw=new Uint8Array(m.w*m.h);for(let i=0;i<raw.length;i++)raw[i]=rgba[i*4+3]>0?1:0;
 const ink=maskBits(dilation(raw,m.w,m.h,Math.ceil(gap/2+1)),m.w,m.h);for(let i=0;i<m.bits.length;i++)m.bits[i]|=ink.bits[i];m.precise=true;return m;
}
function generateFish(index){for(let retry=0;retry<4;retry++){const seed='Frank Fish V3 / '+index+' / '+retry;jsr=str_to_seed(seed)||1;perlin=undefined;const params=generate_params();try{const fish=fishWithSilhouette(params,seed),b=fish.bounds;fish.cx=b[0]+b[2]/2;fish.cy=b[1]+b[3]/2;fish.index=index;fish.weight=.65+randomSequence(Math.imul(index+39171,2654435761))()*1.05;return fish;}catch(e){if(retry===3)throw e;}}}
async function pack(job){
 const {width,height,count,gap,top}=job,margin=8,W=Math.floor(width-margin*2),H=Math.floor(height-top-margin);
 if(W<30||H<30)throw Error('Make the window a little larger.');
 for(let i=library.length;i<count;i++){if(latest!==job.revision)return;library.push(generateFish(i));if(i%5===0)progress(job,'Drawing fish '+(i+1)+' / '+count);await pause();}
 if(latest!==job.revision)return;
 const rng=randomSequence(7781+count*31+W*17+H),board=makeBoard(W,H),placed=[],unplaced=[],fishes=library.slice(0,count).sort((a,b)=>b.weight-a.weight),targetArea=W*H*.95/count;
 for(let n=0;n<fishes.length;n++){
  if(latest!==job.revision)return;const fish=fishes[n],base=Math.sqrt(targetArea/(fish.bounds[2]*fish.bounds[3]*.48))*fish.weight;let found=null;
  for(let pass=0;pass<3&&!found;pass++){
   const scale=base*[1,.80,.62][pass],variants=new Map();let best=-Infinity;
   for(let attempt=0;attempt<96;attempt++){
    const which=attempt%10,angle=[-20,-10,0,10,20][which%5],mirror=which>=5;
    if(!variants.has(which))variants.set(which,variant(fish,scale,angle,mirror,gap));const m=variants.get(which);if(m.w>W||m.h>H)continue;
    let x,y;
    if(placed.length&&attempt%3!==0){const p=placed[Math.floor(rng()*placed.length)],side=Math.floor(rng()*4);x=Math.round(p.x+(rng()-.5)*p.mask.w);y=Math.round(p.y+(rng()-.5)*p.mask.h);if(side===0)x=p.x+p.mask.w-Math.round(rng()*m.w*.22);if(side===1)x=p.x-m.w+Math.round(rng()*m.w*.22);if(side===2)y=p.y+p.mask.h-Math.round(rng()*m.h*.22);if(side===3)y=p.y-m.h+Math.round(rng()*m.h*.22);}
    else{x=Math.floor(rng()*(W-m.w+1));y=Math.floor(rng()*(H-m.h+1));}
    if(maskCollision(board,m,x,y))continue;preciseMask(fish,m,gap);if(maskCollision(board,m,x,y))continue;const score=coarseContact(board,m,x,y)+rng()*.25;if(score>best){best=score;found={fish,mask:m,x,y};}if(found&&attempt>=24)break;
   }
  }
  if(found){addMask(board,found.mask,found.x,found.y);placed.push(found);}else unplaced.push(fish.index);
  if(n%5===0){progress(job,'Arranging '+(n+1)+' / '+count+' · '+placed.length+' placed');await pause();}
 }
 for(const index of unplaced){if(latest!==job.revision)return;const fish=library[index],scale=Math.sqrt(targetArea/(fish.bounds[2]*fish.bounds[3]*.48))*fish.weight*.48,m=variant(fish,scale,0,rng()>.5,gap);for(let j=0;j<96;j++){const x=Math.floor(rng()*(W-m.w+1)),y=Math.floor(rng()*(H-m.h+1));if(!maskCollision(board,m,x,y)){preciseMask(fish,m,gap);if(maskCollision(board,m,x,y))continue;addMask(board,m,x,y);placed.push({fish,mask:m,x,y});break;}}await pause();}
 if(latest!==job.revision)return;progress(job,'Finishing '+placed.length+' fish…');
 const dpr=job.dpr||1,canvas=new OffscreenCanvas(Math.round(width*dpr),Math.round(height*dpr)),ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle='#eff6f2';ctx.fillRect(0,0,width,height);ctx.strokeStyle='#244f53';ctx.lineCap='round';ctx.lineJoin='round';
 for(let n=0;n<placed.length;n++){const p=placed[n],m=p.mask;ctx.save();transform(ctx,p.fish,m.scale,m.angle,m.mirror,margin+p.x+m.w/2,top+p.y+m.h/2);ctx.lineWidth=Math.max(.7,.42/m.scale);ctx.beginPath();linePath(ctx,p.fish.lines);ctx.stroke();ctx.restore();if(n%25===0){await pause();if(latest!==job.revision)return;}}
 let validation;
 if(job.validate){
  const occupied=new Uint8Array(W*H);let overlaps=0,outside=0,covered=0;
  for(const p of placed){const m=p.mask;if(p.x<0||p.y<0||p.x+m.w>W||p.y+m.h>H)outside++;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.stride+(x>>>5)]&(1<<(x&31))){const index=(p.y+y)*W+p.x+x;if(occupied[index])overlaps++;occupied[index]=1;covered++;}}
  let uncovered=0;
  if(dpr===1){const pixels=ctx.getImageData(0,0,width,height).data;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(pixels[i]<235||pixels[i+1]<242||pixels[i+2]<238){const bx=x-margin,by=y-top;if(bx<0||by<0||bx>=W||by>=H||!occupied[by*W+bx])uncovered++;}}}
  validation={overlaps,outside,uncovered,covered,area:W*H,generated:library.length};
 }
 const bitmap=canvas.transferToImageBitmap();postMessage({type:'done',revision:job.revision,bitmap,placed:placed.length,target:count,generated:library.length,validation},[bitmap]);
}
async function run(){if(running)return;running=true;while(queued){const job=queued;queued=null;try{await pack(job);}catch(e){if(latest===job.revision)postMessage({type:'error',revision:job.revision,message:'Could not prepare this composition.'});console.error(e);}}running=false;}
onmessage=({data})=>{latest=data.revision;if(data.type==='cancel'){queued=null;return;}queued=data;run();};
