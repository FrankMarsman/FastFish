const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let next=0;const timers=new Map(),events={},workers=[],calls=[];
const nodes=Object.fromEntries(['sea','controls','count','gap','countValue','gapValue','status'].map(id=>[id,{value:id==='count'?'500':id==='gap'?'4':'',textContent:'',addEventListener(type,fn){this[type]=fn;},getBoundingClientRect:()=>({bottom:80})}]));
nodes.sea.getContext=()=>({setTransform(){},fillRect(){},drawImage(b){calls.push(b);}});
class Worker{constructor(){workers.push(this);this.messages=[];}postMessage(d){this.messages.push(d);}terminate(){this.terminated=true;}}
const context={document:{getElementById:id=>nodes[id]},Worker,innerWidth:1280,innerHeight:800,devicePixelRatio:2,addEventListener:(n,f)=>events[n]=f,setTimeout:f=>{timers.set(++next,f);return next;},clearTimeout:i=>timers.delete(i)};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
const w=workers[0];assert.equal(w.messages[0].count,500);
for(const count of [550,1000,100]){nodes.count.value=String(count);nodes.count.input();}assert.equal(timers.size,1);assert.equal(w.messages.filter(m=>m.type==='layout').length,1);
[...timers.values()][0]();timers.clear();assert.equal(w.messages.at(-1).count,100);
let closed=0;const stale={close(){closed++;}},fresh={close(){closed++;}};w.onmessage({data:{type:'done',revision:0,bitmap:stale,placed:500,target:500}});assert.equal(closed,1);assert.equal(calls.length,0);
w.onmessage({data:{type:'done',revision:w.messages.at(-1).revision,bitmap:fresh,placed:80,target:100}});assert.equal(calls.at(-1),fresh);assert.match(nodes.status.textContent,/80 \/ 100/);
nodes.gap.value='20';nodes.gap.input();assert.equal(calls.at(-1),fresh);assert.equal(w.messages.at(-1).type,'cancel');events.resize();assert.equal(timers.size,1);
w.onerror();assert(w.terminated);[...timers.values()][0]();assert.equal(workers.length,2);events.pagehide();assert(workers[1].terminated);assert.equal(closed,2);
console.log('PASS 250ms debounce, latest count, stale-result rejection, retained image, resize cancellation, worker-error retry and cleanup');
