const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

// Drive the actual controller with deterministic workers, clocks and frames.
function setup(){
 const elements=new Map(),workers=[],frames=new Map(),windowEvents={};let now=0,nextId=0;
 function element(){const node={value:'',textContent:'',disabled:false,dataset:{},attributes:{},listeners:{},style:{setProperty(){}},append(){},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},firstElementChild:{attributes:{},setAttribute(k,v){this.attributes[k]=v;}}};Object.defineProperty(node,'id',{set(id){elements.set(id,node);}});return node;}
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};get('seed').value='test fish';get('engine').value='original';
 class Worker{constructor(){workers.push(this);this.messages=[];}postMessage(data){this.messages.push(structuredClone(data));}terminate(){this.terminated=true;}}
 const ctx=vm.createContext({console,Worker,createFishWorker:()=>new Worker(),performance:{now:()=>now},document:{getElementById:get,createElement:element},window:{addEventListener(k,fn){windowEvents[k]=fn;}},
  requestAnimationFrame:fn=>{const id=++nextId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
 const run=code=>vm.runInContext(code,ctx);
 run(fs.readFileSync(path.join(__dirname,'../../src/controls.js'),'utf8'));run(fs.readFileSync(path.join(__dirname,'../../src/app.js'),'utf8'));
 const result={d:'M0 0L10 10',box:[0,0,10,10],lines:1};
 const last=w=>w.messages.at(-1);
 const reply=(w,data,message=last(w))=>w.onmessage({data:{id:message.id,engine:message.engine,generationMs:12.3,...data}});
 const tick=()=>{const batch=[...frames.values()];frames.clear();now+=16;batch.forEach(fn=>fn());};
 const params=()=>run('Object.fromEntries(controls.map(c=>[c.key,c.values[0]]))');
 function initialize(){now=100;reply(workers[0],{params:params()});return workers[0];}
 function select(name){get('engine').value=name;get('engine').listeners.change();}
 function finish(w=workers.at(-1)){reply(w,{result});tick();tick();}
 return {get,workers,frames,windowEvents,run,result,last,reply,tick,initialize,select,finish,params,setTime:value=>now=value};
}
module.exports={setup};
