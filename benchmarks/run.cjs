const fs=require('node:fs'),path=require('node:path');
const {buildCorpus}=require('./corpus.cjs');
const {loadEngine,measure,combine,equivalent,classify,environment,harnessHash}=require('./harness.cjs');
const {summarize,renderMarkdown,renderCsv}=require('./report.cjs');
function parse(argv){
 const options={mode:'baseline',samples:3,warmups:32,recheckSamples:7,relativeThreshold:.05,absoluteThresholdMs:.25};
 const names={'--mode':'mode','--engine':'engine','--baseline':'baseline','--candidate':'candidate','--out':'out','--samples':'samples','--warmups':'warmups','--recheck':'recheckSamples','--golden':'golden','--limit':'limit'};
 for(let i=0;i<argv.length;i+=2){if(!names[argv[i]]||argv[i+1]===undefined)throw Error('Unknown/incomplete argument: '+argv[i]);options[names[argv[i]]]=argv[i+1];}
 for(const key of ['samples','warmups','recheckSamples','limit'])if(options[key]!==undefined){options[key]=Number(options[key]);if(!Number.isInteger(options[key])||options[key]<(key==='warmups'?0:1))throw Error('Invalid '+key);}
 if(!['baseline','compare'].includes(options.mode)||!options.out)throw Error('Specify --mode baseline|compare and --out PREFIX');
 if(options.mode==='baseline'&&!options.engine)throw Error('Specify --engine FILE');
 if(options.mode==='compare'&&(!options.baseline||!options.candidate||!options.golden))throw Error('Specify --baseline FILE --candidate FILE --golden BASELINE.json');
 return options;
}
function run(options){
 const corpus=buildCorpus(),cases=options.limit?corpus.cases.slice(0,options.limit):corpus.cases;
 const engines=options.mode==='baseline'?{baseline:loadEngine(options.engine)}:{baseline:loadEngine(options.baseline),candidate:loadEngine(options.candidate)};
 const golden=options.golden?JSON.parse(fs.readFileSync(options.golden,'utf8')):null;
 if(golden&&(golden.corpusSha256!==corpus.sha256||golden.engines.baseline.sha256!==engines.baseline.sha256||golden.harnessSha256!==harnessHash()))throw Error('Golden baseline source/corpus mismatch');
 const goldenRows=new Map((golden?.rows||[]).map(r=>[r.id,r.result]));
 const output=path.resolve(options.out);if(fs.existsSync(output+'.json'))throw Error('Result exists; choose a new --out prefix');fs.mkdirSync(path.dirname(output),{recursive:true});
 const repoRoot=path.resolve(__dirname,'..');
 fs.writeFileSync(path.join(__dirname,'corpus.json'),corpus.canonical);
 const metadata=Object.fromEntries(Object.entries(engines).map(([name,{api,...rest}])=>[name,rest]));
 const coverage={groups:{}};for(const c of cases)coverage.groups[c.group]=(coverage.groups[c.group]||0)+1;
 const report={schemaVersion:1,mode:options.mode,startedAt:new Date().toISOString(),metric:'fish(params) generation only',environment:environment(),corpusSha256:corpus.sha256,corpusFile:'benchmarks/corpus.json',harnessSha256:harnessHash(),coverage,engines:metadata,options:{samples:options.samples,warmups:options.warmups,recheckSamples:options.recheckSamples,relativeThreshold:options.relativeThreshold,absoluteThresholdMs:options.absoluteThresholdMs},rows:[]};
 console.log(JSON.stringify({mode:options.mode,cases:cases.length,coverage,engines:metadata,samples:options.samples,warmups:options.warmups}));
 for(let i=0;i<options.warmups;i++)for(const engine of Object.values(engines))measure(engine,cases[Math.floor(i*cases.length/Math.max(1,options.warmups))]);
 function pair(c,count,offset){
  const samples={baseline:[],candidate:[]};
  for(let i=0;i<count;i++)for(const name of (i+offset)%2?['candidate','baseline']:['baseline','candidate'])samples[name].push(measure(engines[name],c));
  return {baseline:combine(samples.baseline),candidate:combine(samples.candidate)};
 }
 for(let i=0;i<cases.length;i++){
  const c=cases[i],row={id:c.id,group:c.group,scaleType:c.params.scale_type,patternType:c.params.pattern_type};
  if(options.mode==='baseline')row.result=combine(Array.from({length:options.samples},()=>measure(engines.baseline,c)));
  else{
   Object.assign(row,pair(c,options.samples,i));
   const recorded=goldenRows.get(c.id);
   if(!recorded)throw Error('Golden baseline missing '+c.id);
   row.equivalent=equivalent(row.baseline,row.candidate)&&equivalent(recorded,row.baseline);
   row.initialClassification=row.equivalent&&row.baseline.status==='ok'?classify(row.baseline.medianMs,row.candidate.medianMs,options.relativeThreshold,options.absoluteThresholdMs):'not-comparable';
   row.classification=row.initialClassification;
   if(row.initialClassification==='regression'){
    row.recheck=pair(c,options.recheckSamples,i+1);
    row.equivalent=row.equivalent&&equivalent(row.recheck.baseline,row.recheck.candidate)&&equivalent(recorded,row.recheck.baseline);
    row.classification=row.equivalent&&row.recheck.baseline.status==='ok'?classify(row.recheck.baseline.medianMs,row.recheck.candidate.medianMs,options.relativeThreshold,options.absoluteThresholdMs):'not-comparable';
   }
  }
  report.rows.push(row);
  if((i+1)%64===0||i===cases.length-1){
   const elapsed=(Date.now()-Date.parse(report.startedAt))/1000;
   console.log(JSON.stringify({completed:i+1,total:cases.length,elapsedSeconds:+elapsed.toFixed(1),lastCase:c.id}));
   fs.writeFileSync(output+'.partial.json',JSON.stringify(report)+'\n');
  }
 }
 report.finishedAt=new Date().toISOString();report.elapsedSeconds=(Date.parse(report.finishedAt)-Date.parse(report.startedAt))/1000;
 report.summary=summarize(report);
 fs.writeFileSync(output+'.json',JSON.stringify(report)+'\n');fs.writeFileSync(output+'.md',renderMarkdown(report));fs.writeFileSync(output+'.csv',renderCsv(report));
 fs.unlinkSync(output+'.partial.json');console.log('SUMMARY '+JSON.stringify(report.summary));
 return report;
}
if(require.main===module){try{const report=run(parse(process.argv.slice(2)));if(report.mode==='compare'&&!report.summary.accepted)process.exitCode=2;}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={parse,run};
