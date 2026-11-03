const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
function workerSources(){
 const worker=read('demo/src/fish-worker.js');
 return Object.fromEntries(Object.entries({original:'fishdraw.js',fast:'FishDraw_Fast.js'}).map(([name,file])=>[
  name,'const loadedEngine='+JSON.stringify(name)+';\n'+read(file)+'\n'+worker
 ]));
}
function bundle(){
 const bootstrap=`const bundledWorkers=${safeJSON(workerSources())};
function createFishWorker(name){
 if(!Object.hasOwn(bundledWorkers,name))throw Error('Unknown generator');
 const url=URL.createObjectURL(new Blob([bundledWorkers[name]],{type:'text/javascript'}));
 try{return new Worker(url);}finally{URL.revokeObjectURL(url);}
}`;
 const script=[bootstrap,read('demo/src/controls.js'),read('demo/src/app.js')].join('\n');
 return read('demo/src/index.html')
  .replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+read('demo/src/style.css')+'</style>')
  .replace('<script src="controls.js"></script><script src="app.js"></script>',
   ()=>'<script>'+script.replace(/<\/script/gi,'<\\/script')+'</script>')
  .replace('<body>', ()=>'<!-- '+read('LICENSE')+' -->\n<body>');
}
if(require.main===module){
 const html=bundle();fs.writeFileSync(path.join(__dirname,'index.html'),html);
 console.log('Built demo/index.html ('+Buffer.byteLength(html)+' bytes; no external runtime assets).');
}
module.exports={bundle,workerSources};
