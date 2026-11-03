const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(process.argv[2]||path.join(__dirname,'../FishDraw_Fast.js'),'utf8');
let code=source;
function replace(a,b){if(!code.includes(a))throw Error('Missing instrumentation point: '+a);code=code.replace(a,b);}
replace('function fish(arg){','let silhouetteCollector=null;\nfunction fish(arg){');
replace('  let sh = shade_shape(outline,8,-12,-12);','  const bodyBoundary=outline.map(p=>p.slice());\n  let sh = shade_shape(outline,8,-12,-12);');
replace('  return [outlinel,[','  if(silhouetteCollector)silhouetteCollector.push({fill:[outline,lip0,lip1,jc,...bbs],cut:[]});\n  return [outlinel,[');
replace('  return [out0.concat(curve.slice().reverse()),[out0]];','  if(silhouetteCollector)silhouetteCollector.push({fill:[out0.concat(curve.slice().reverse())],cut:[]});\n  return [out0.concat(curve.slice().reverse()),[out0]];');
replace('  return [cc,[out0,...out1]];','  if(silhouetteCollector)silhouetteCollector.push({fill:[cc],cut:[]});\n  return [cc,[out0,...out1]];');
replace('  let cf,fh;','  if(silhouetteCollector && arg.finlet_type===3 && c5)silhouetteCollector.push({fill:[c5],cut:[]});\n  let cf,fh;');
replace('  return bd.','  if(silhouetteCollector)silhouetteCollector.push(\n    {fill:[bodyBoundary],cut:[cf]},\n    {fill:[c0,c2,c3,c4],cut:[]},\n    {fill:[c1],cut:[cf]}\n  );\n  return bd.');
code+=`\nfunction fishWithSilhouette(params,seed){
 jsr=str_to_seed(seed)||1;perlin=undefined;
 const parts=[];silhouetteCollector=parts;let lines;
 try{lines=cleanup(fish({...params}));}finally{silhouetteCollector=null;}
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const line of lines)for(const [x,y]of line){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid geometry');x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(!lines.length||!(x1>x0&&y1>y0))throw Error('Empty drawing');
 return {lines,parts,bounds:[x0,y0,x1-x0,y1-y0]};
}
if(typeof module!=='undefined')module.exports.fishWithSilhouette=fishWithSilhouette;
`;
fs.writeFileSync(path.join(__dirname,'dist/vendor/FishDraw_Fast.js'),code);
