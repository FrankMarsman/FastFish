const assert=require('node:assert/strict'),vm=require('node:vm');
const {bundle,workerSources}=require('../build.cjs');
const html=bundle();
assert(!/<script\b[^>]*\bsrc=/i.test(html));assert(!/<link\b[^>]*\brel="stylesheet"/i.test(html));
assert(!/importScripts\(/.test(html));assert(!html.includes("new Worker('fish-worker.js')"));
assert(html.includes('Copyright (c) 2021 Lingdong Huang'));
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
let reference;
for(const [engine,source]of Object.entries(workerSources())){
 let response;
 const send=new Function('module','require','postMessage','performance','let onmessage;\n'+source+';return data=>onmessage({data});')(undefined,undefined,data=>response=data,performance);
 send({id:1,action:'params',engine,seed:'Offline demo'});assert(response.params);
 send({id:2,action:'render',engine,seed:'Offline demo',params:response.params});assert(!response.error,response.error);assert(response.result.d.length>100);assert(response.result.box.every(Number.isFinite));
 if(reference)assert.deepEqual(response.result,reference);else reference=response.result;
 console.log('PASS embedded '+engine+' worker generation');
}
console.log('PASS self-contained bundle, syntax, license and exact worker SVG equivalence');
