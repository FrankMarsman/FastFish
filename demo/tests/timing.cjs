const assert=require('node:assert/strict');
const {setup}=require('./helpers/controller.cjs');

{
 const t=setup();assert.equal(t.last(t.workers[0]).engine,'fast');assert.equal(t.get('body_curve_type').disabled,true);
 const worker=t.initialize();assert.equal(worker.messages.length,2);assert.equal(t.get('body_curve_type').disabled,false);
 t.setTime(200);t.reply(worker,{result:t.result});assert.equal(t.get('drawTime').textContent,'Measuring…');t.tick();assert.equal(t.get('drawTime').textContent,'Measuring…');t.tick();
 assert.equal(t.get('drawTime').textContent,'232.0 ms');assert.equal(t.get('generationTime').textContent,'12.3 ms');assert.equal(t.get('drawSource').textContent,'Generated');
 const n=worker.messages.length;t.run('requestRender()');assert.equal(worker.messages.length,n+1,'Repeated settings generate again');t.finish(worker);
 t.get('reset').onclick();assert.equal(t.workers.length,1,'Reuse the idle Fast worker');assert.equal(t.last(worker).engine,'fast');
 console.log('PASS Fast-only generation, initialization timing, generation timing, worker reuse and no result cache');
}
{
 const t=setup(),worker=t.initialize();t.setTime(110);t.run('change(controls[0],1)');t.setTime(150);t.run('change(controls[1],1)');
 assert.equal(worker.messages.length,2,'Only one running request during continuous changes');const finalState=t.run('JSON.stringify(params)');
 t.setTime(200);t.reply(worker,{result:{...t.result,d:'intermediate frame'}});assert.equal(t.run('current.d'),'intermediate frame','Completed frames must display during a drag');
 assert.equal(worker.messages.length,3);assert.equal(JSON.stringify(t.last(worker).params),finalState,'Only latest pending settings are sent');
 t.setTime(300);t.reply(worker,{result:{...t.result,d:'final frame'}});t.tick();t.tick();
 assert.equal(t.run('current.d'),'final frame');assert.equal(t.get('drawTime').textContent,'182.0 ms','Includes pending wait from latest input');
 console.log('PASS latest-only pending inputs, continuous completed frames, final state, queue wait timing');
}
{
 const t=setup(),worker=t.initialize();t.reply(worker,{result:t.result});t.tick();const oldFrame=[...t.frames.values()][0];t.get('seed').value='new seed';t.get('seed').listeners.change();oldFrame();
 assert.equal(t.get('drawTime').textContent,'Generating…');const fast=t.workers.at(-1);t.finish(fast);const reading=t.get('drawTime').textContent;oldFrame();assert.equal(t.get('drawTime').textContent,reading);
 t.windowEvents.pagehide();assert(t.workers.every(w=>w.terminated));
 console.log('PASS stale timing callbacks and worker cleanup');
}
{
 const t=setup(),worker=t.initialize();t.reply(worker,{error:'Invalid geometry'});assert.equal(t.get('drawTime').textContent,'Unavailable');assert.equal(t.get('generationTime').textContent,'Unavailable');
 t.run('change(controls[0],1)');assert.equal(worker.messages.length,3);t.finish(worker);assert.equal(t.get('generationTime').textContent,'12.3 ms');
 t.run('requestRender()');worker.onerror();assert.equal(t.get('drawTime').textContent,'Unavailable');t.run('requestRender()');assert.equal(t.workers.length,2);t.finish();
 console.log('PASS drawing errors, worker errors, recovery');
}
{
 const t=setup(),worker=t.initialize();t.run('change(controls[0],1)');t.reply(worker,{error:'superseded drawing failure'});assert.equal(worker.messages.length,3);t.finish(worker);
 t.run('requestRender();change(controls[1],1)');worker.onerror();assert(worker.terminated);assert.equal(t.workers.length,2);t.finish();
 console.log('PASS pending request recovery after a superseded failure or crashed worker');
}
{
 const t=setup();assert(t.get('random').disabled,'New fish needs a displayed source');const old=t.workers[0],oldJob=t.last(old);
 t.get('reset').onclick();const fast=t.workers.at(-1);assert(old.terminated);assert.equal(t.last(fast).random,false);
 t.reply(old,{params:t.params()},oldJob);assert.equal(t.run('paramsReady'),false);
 t.reply(fast,{params:t.params()});assert(t.get('random').disabled);t.finish(fast);assert(!t.get('random').disabled);
 t.get('reset').onclick();assert.equal(t.last(fast).random,false);assert.equal(t.last(fast).engine,'fast');
 console.log('PASS cancelled initialization, source readiness for New fish and Reset');
}

{
 const t=setup(),old=t.initialize(),oldJob=t.last(old);const before=t.run('JSON.stringify(params)');t.get('seed').value='Another fish';t.get('seed').listeners.change();
 const worker=t.workers.at(-1);assert(old.terminated);assert.equal(t.last(worker).seed,'Another fish');assert.equal(JSON.stringify(t.last(worker).params),before);
 t.reply(old,{result:{...t.result,d:'old seed'}},oldJob);t.finish(worker);assert.equal(t.run('currentSeed'),'Another fish');
 t.get('seed').value=' ';t.get('seed').listeners.change();assert.equal(t.get('seed').value,'Franky fishus');
 console.log('PASS seed changes, stale replies, export seed, blank seed fallback');
}
