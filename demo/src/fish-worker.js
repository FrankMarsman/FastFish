onmessage=({data})=>{
 try {
  if(loadedEngine&&loadedEngine!==data.engine)throw Error('Worker cannot switch generators');
  jsr=str_to_seed(data.seed)||1; perlin=undefined;
  if(data.action==='params'){postMessage({id:data.id,engine:loadedEngine,params:data.random?generate_params():default_params()});return;}
  const startedAt=performance.now();
  const drawing=fish({...data.params});
  const generationMs=performance.now()-startedAt;
  const lines=cleanup(drawing);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  const d=lines.map(line=>line.map(([x,y],i)=>{
   if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid geometry');
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   return (i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);
  }).join('')).join('');
  if(!d)throw Error('Empty drawing');
  const pad=Math.max(x1-x0,y1-y0)*.055+2;
  postMessage({id:data.id,engine:loadedEngine,generationMs,result:{d,box:[x0-pad,y0-pad,x1-x0+2*pad,y1-y0+2*pad],lines:lines.length}});
 } catch(e){postMessage({id:data.id,engine:data.engine,error:e.message});}
};
