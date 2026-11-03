const assert=require('node:assert/strict');
const {setup}=require('./helpers/controller.cjs');
for(const key of ['scale_type','pattern_type','tail_type','finlet_type']){
 const t=setup(),w=t.initialize();t.finish(w);
 const dial=t.get(key),count=t.run(`controls.find(c=>c.key==='${key}').values.length`);
 const pointer=(x,y,extra={})=>({pointerId:1,button:0,isPrimary:true,clientX:x,clientY:y,preventDefault(){},...extra});
 assert.equal(dial.attributes.role,'slider');assert.equal(dial.attributes['aria-valuemax'],String(count-1));
 dial.onpointerdown(pointer(22,22));dial.listeners.pointerup(pointer(22,22));assert.equal(dial.value,'0','A click does not open or change the dial');
 for(let i=0;i<count;i++){
  dial.onpointerdown(pointer(22,22));const angle=i*2*Math.PI/count;
  dial.onpointermove(pointer(22+60*Math.sin(angle),22-60*Math.cos(angle)));
  assert.equal(dial.value,String(i));assert.equal(dial.attributes['aria-valuenow'],String(i));
  assert.equal(dial.attributes['aria-valuetext'],t.run(`controls.find(c=>c.key==='${key}').options[${i}]`));
  dial.listeners.pointerup(pointer(22,22));assert.equal(dial.capture,null);
 }
 const press=key=>dial.onkeydown({key,preventDefault(){}});
 press('End');assert.equal(dial.value,String(count-1));press('ArrowRight');assert.equal(dial.value,'0');press('ArrowLeft');assert.equal(dial.value,String(count-1));press('Home');assert.equal(dial.value,'0');
 t.run(`nodes.get('${key}').choices[1].onclick()`);assert.equal(dial.value,'1','Labels stay clickable');
 dial.onpointerdown(pointer(22,22));dial.listeners.pointercancel(pointer(22,22));dial.onpointermove(pointer(22,-40));assert.equal(dial.value,'1','Cancelled drags cannot change the setting');
 dial.disabled=true;dial.onpointerdown(pointer(22,22));dial.onpointermove(pointer(22,-40));press('Home');assert.equal(dial.value,'1','Disabled dials ignore pointer and keyboard input');
 console.log('PASS '+key+': rotation, click, keyboard wrapping, labels, cancellation and disabled state');
}
