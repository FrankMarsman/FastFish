const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
function loadEngine(file){
 const absolute=path.resolve(file),source=fs.readFileSync(absolute,'utf8');
 const api=new Function('module','require',source+';return {fish,reset(seed){jsr=str_to_seed(seed)||1;perlin=undefined;}};')(undefined,undefined);
 return {file:path.relative(path.resolve(__dirname,'..'),absolute),sha256:sha256(source),gitBlobSha:crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),api};
}
function fingerprint(lines){
 if(!Array.isArray(lines))throw Error('Invalid drawing array');
 if(!lines.length)throw Error('Empty geometry');
 let points=0,numbers=0;
 for(const line of lines){if(!Array.isArray(line))throw Error('Invalid polyline');points+=line.length;for(const p of line){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw Error('Non-finite or non-2D geometry');numbers+=p.length;}}
 const buffer=Buffer.allocUnsafe(4*(1+lines.length)+8*numbers);let offset=0;
 buffer.writeUInt32LE(lines.length,offset);offset+=4;
 for(const line of lines){buffer.writeUInt32LE(line.length,offset);offset+=4;for(const p of line)for(const value of p){buffer.writeDoubleLE(value,offset);offset+=8;}}
 return {hash:sha256(buffer),lines:lines.length,points};
}
function measure(engine,c){
 engine.api.reset(c.seed);const params={...c.params};let drawing,elapsedMs;
 const started=performance.now();
 try{drawing=engine.api.fish(params);elapsedMs=performance.now()-started;}catch(error){return{status:'error',ms:performance.now()-started,error:error.name+': '+error.message};}
 try{return{status:'ok',ms:elapsedMs,...fingerprint(drawing)};}catch(error){return{status:'error',ms:elapsedMs,error:error.message};}
}
const median=values=>{if(!values.length)return null;const a=values.slice().sort((x,y)=>x-y),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
function combine(samples){
 const identities=samples.map(x=>x.status==='ok'?'ok:'+x.hash:'error:'+x.error),consistent=identities.every(x=>x===identities[0]);
 const first=samples[0];return {status:consistent?first.status:'nondeterministic',medianMs:median(samples.map(x=>x.ms)),samplesMs:samples.map(x=>x.ms),...(first.hash?{hash:first.hash,lines:first.lines,points:first.points}:{}),...(first.error?{error:first.error}:{}),consistent};
}
function equivalent(a,b){return a.consistent&&b.consistent&&a.status===b.status&&(a.status==='ok'?a.hash===b.hash:a.error===b.error);}
function classify(a,b,relative=.05,absolute=.25){const delta=b-a;if(delta>absolute&&delta/a>relative)return'regression';if(-delta>absolute&&-delta/a>relative)return'improvement';return'within-threshold';}
function distribution(values){if(!values.length)return{count:0};const a=values.slice().sort((x,y)=>x-y),q=p=>a[Math.max(0,Math.ceil(p*a.length)-1)];return{count:a.length,min:a[0],p50:median(a),p90:q(.90),p95:q(.95),p99:q(.99),max:a.at(-1),sum:a.reduce((n,x)=>n+x,0)};}
function environment(){return{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length,osRelease:os.release(),execArguments:process.execArgv};}
function harnessHash(){return sha256(['corpus.cjs','harness.cjs','run.cjs','report.cjs','parameter-space.json'].map(name=>name+'\0'+fs.readFileSync(path.join(__dirname,name),'utf8')).join('\0'));}
module.exports={fingerprint,loadEngine,measure,combine,equivalent,classify,median,distribution,environment,harnessHash};
