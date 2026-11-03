const assert=require('node:assert/strict');
const {setup}=require('./helpers/controller.cjs');
function ready(){const t=setup(),w=t.initialize();t.finish(w);return {t,w};}
const target=t=>t.run('Object.fromEntries(controls.map(c=>[c.key,c.values.at(-1)]))');
const values=t=>t.run('JSON.stringify(controls.map(c=>{const n=nodes.get(c.key);return [n.input.value,n.input.attributes["aria-checked"],n.out.value];}))');
function locked(t,expected){
 assert.equal(t.run('[...nodes.values()].every(n=>n.input.disabled&&n.buttons.every(b=>b.disabled))'),expected);
 for(const id of ['random','reset','seed'])assert.equal(t.get(id).disabled,expected,id);
}
function prepare(t,w){t.get('random').onclick();t.reply(w,{params:target(t)});}
function cacheAll(t,w){for(let step=1;step<=25;step++)t.reply(w,{result:{...t.result,d:'frame '+step}});}
{
 const {t,w}=ready();t.run('controls.filter(c=>c.options).forEach((c,i)=>params[c.key]=i%c.values.length);requestRender()');t.finish(w);
 const from=JSON.parse(t.run('JSON.stringify(params)')),frozen=values(t),source=t.run('current.d'),sourceSeed=t.run('seed');
 prepare(t,w);locked(t,true);assert.equal(t.get('morphProgress').hidden,false);assert.equal(t.get('morphBar').value,0);
 t.get('random').onclick();t.get('reset').onclick();t.run("change(controls[0],1);requestRender()");
 const proposed=target(t);for(const c of t.run('controls'))if(c.options)proposed[c.key]=from[c.key];
 for(let step=1;step<=25;step++){
  const message=t.last(w);assert.equal(message.seed,sourceSeed);assert.equal(t.run('morph.step'),step);
  assert(Object.values(message.params).every(Number.isFinite));
  for(const c of t.run('controls')){
   if(c.integer||c.options)assert(Number.isInteger(message.params[c.key]));
   if(c.options)assert.equal(message.params[c.key],from[c.key]);
  }
  if(step===1)assert(Math.abs(message.params.body_length-208.8)<1e-10);
  // Simulate widely varying generation times. No drawing changes during preparation.
  t.setTime(1000+step*step*10);t.reply(w,{result:{...t.result,d:'frame '+step}});
  assert.equal(t.run('current.d'),source);assert.equal(t.get('morphBar').value,step);assert.equal(t.get('morphCount').textContent,step+'/25');
  assert.equal(values(t),frozen);locked(t,true);
 }
 const count=w.messages.length;assert.equal(t.run('morph.frames.length'),25);
 t.tick();assert.equal(t.run('current.d'),source,'Full progress bar gets a paint opportunity');t.tick();
 for(let step=1;step<=25;step++){
  assert.equal(t.run('current.d'),'frame '+step);assert.equal(values(t),frozen);locked(t,true);
  assert.equal(w.messages.length,count,'Playback must not generate anything');
  t.tick();assert.equal(t.run('current.d'),'frame '+step);t.tick();
 }
 assert.equal(t.run('morph'),null);locked(t,false);assert.equal(t.get('morphProgress').hidden,true);
 assert.equal(t.run('JSON.stringify(params)'),JSON.stringify(proposed));assert.equal(t.run('currentSeed'),sourceSeed);
 assert(!t.get('export').disabled);assert.match(t.get('drawSource').textContent,/Cached animation/);
 assert.match(t.get('drawTime').textContent,/ms$/);
 console.log('PASS cache all 25 frames before playback, progress counts, fixed playback cadence despite variable generation, no generation in playback, frozen categories/controls, exact endpoint');
}
for(const phase of ['parameters','frame'])for(const crash of [false,true]){
 const {t,w}=ready(),source=t.run('JSON.stringify(params)'),sourcePath=t.run('current.d');
 t.get('random').onclick();if(phase==='frame'){t.reply(w,{params:target(t)});t.reply(w,{result:t.result});}
 if(crash)w.onerror();else t.reply(w,{error:'Test failure'});
 assert.equal(t.run('morph'),null);locked(t,false);assert.equal(t.get('morphProgress').hidden,true);
 assert.equal(t.run('JSON.stringify(params)'),source);assert.equal(t.run('current.d'),sourcePath);
 assert.equal(t.get('drawTime').textContent,'Unavailable');t.get('random').onclick();locked(t,true);
 console.log('PASS '+phase+' '+(crash?'worker crash':'generation error')+' clears cache/progress, restores source and permits retry');
}
for(const phase of ['preparing','playing']){
 const {t,w}=ready();prepare(t,w);if(phase==='playing')cacheAll(t,w);
 const stale=[...t.frames.values()][0],count=w.messages.length;
 t.windowEvents.pagehide();if(stale)stale();t.tick();t.tick();
 assert.equal(w.messages.length,count);assert.equal(t.run('morph'),null);assert(t.workers.every(worker=>worker.terminated));assert.equal(t.get('morphProgress').hidden,true);
 console.log('PASS cancel '+phase+' and reject stale playback callbacks');
}
{
 const {t,w}=ready(),source=t.run('JSON.stringify(currentParams)');t.run('change(controls[1],1)');const old=t.last(w);
 t.get('random').onclick();assert(w.terminated);assert.equal(t.run('JSON.stringify(morph.from)'),source);
 t.reply(w,{result:{...t.result,d:'stale'}},old);assert.notEqual(t.run('current.d'),'stale');
 console.log('PASS starts from displayed fish and rejects cancelled foreground results');
}
