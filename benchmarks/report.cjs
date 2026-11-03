const {distribution,classify}=require('./harness.cjs');
const rounded=n=>!Number.isFinite(n)?'—':n.toFixed(2);
function summarize(report){
 const valid=report.rows.filter(r=>report.mode==='baseline'?r.result.status==='ok':r.baseline.status==='ok'&&r.candidate.status==='ok'&&r.equivalent);
 const result={totalCases:report.rows.length,successfulCases:valid.length,failedCases:report.rows.filter(r=>report.mode==='baseline'?r.result.status!=='ok':r.baseline.status!=='ok'||r.candidate.status!=='ok').length};
 if(report.mode==='baseline')result.timings=distribution(valid.map(r=>r.result.medianMs));
 else{
  result.baseline=distribution(valid.map(r=>r.baseline.medianMs));result.candidate=distribution(valid.map(r=>r.candidate.medianMs));
  result.aggregateSpeedup=result.baseline.sum/result.candidate.sum;
  result.geometryOrErrorMismatches=report.rows.filter(r=>!r.equivalent).length;
  result.newFailures=report.rows.filter(r=>r.baseline.status==='ok'&&r.candidate.status!=='ok').length;
  result.initialRegressions=valid.filter(r=>r.initialClassification==='regression').length;
  result.confirmedRegressions=valid.filter(r=>r.classification==='regression').length;
  result.improved=valid.filter(r=>r.classification==='improvement').length;
  result.withinThreshold=valid.filter(r=>r.classification==='within-threshold').length;
  result.strictlySlowerMedians=valid.filter(r=>(r.recheck?.candidate||r.candidate).medianMs>(r.recheck?.baseline||r.baseline).medianMs).length;
  result.accepted=result.successfulCases>0&&result.aggregateSpeedup>=1.05&&result.geometryOrErrorMismatches===0&&result.newFailures===0&&result.confirmedRegressions===0;
 }
 return result;
}
function renderMarkdown(report){
 const s=report.summary,comparison=report.mode==='compare';
 let text=`# ${comparison?'Clipping comparison':'FishDraw_Fast.js v1 baseline'}\n\n`;
 text+=`Measured **FishDraw_Fast.js**, not the original fishdraw.js. Metric: uncached \`fish(params)\` generation only. Cleanup, SVG conversion, workers, transport and painting are excluded.\n\n`;
 text+=`- UTC run: ${report.startedAt} to ${report.finishedAt}\n- Runtime: ${report.environment.node}, V8 ${report.environment.v8}; ${report.environment.cpu}, ${report.environment.architecture}, ${report.environment.platform}\n- Corpus: ${report.rows.length} configurations; ${report.options.samples} samples per engine/case; ${report.options.warmups} global warm-up draws per engine\n- Corpus SHA-256: \`${report.corpusSha256}\`\n- Harness SHA-256: \`${report.harnessSha256}\`\n`;
 for(const [name,e]of Object.entries(report.engines))text+=`- ${name}: \`${e.file}\`, Git blob \`${e.gitBlobSha}\`, SHA-256 \`${e.sha256}\`\n`;
 text+='\n## Results\n\n';
 text+=comparison?'| Per-case median distribution | Frozen v1 | Clipping candidate |\n|---|---:|---:|\n':'| Per-case median distribution | FishDraw_Fast.js v1 |\n|---|---:|\n';
 for(const [key,label]of [['p50','Median'],['p90','P90'],['p95','P95'],['p99','P99'],['max','Slowest'],['sum','Sum across cases']])text+=comparison?`| ${label} | ${rounded(s.baseline[key])} ms | ${rounded(s.candidate[key])} ms |\n`:`| ${label} | ${rounded(s.timings[key])} ms |\n`;
 text+=`\nSuccessful: **${s.successfulCases}/${s.totalCases}**. Cases with errors or invalid geometry: **${s.failedCases}**; these remain in the raw results and are excluded from successful-generation timing summaries.\n`;
 if(comparison){
  text+=`\nAggregate speed-up (sum of matched per-case medians): **${rounded(s.aggregateSpeedup)}×**.\n\n`;
  text+=`| Check | Count |\n|---|---:|\n| Exact geometry/error mismatches | ${s.geometryOrErrorMismatches} |\n| New failures | ${s.newFailures} |\n| Improvements beyond threshold | ${s.improved} |\n| Within threshold | ${s.withinThreshold} |\n| Initially flagged regressions | ${s.initialRegressions} |\n| Confirmed regressions | ${s.confirmedRegressions} |\n| Strictly slower final medians, including tiny differences | ${s.strictlySlowerMedians} |\n`;
  text+=`\nRegression threshold, chosen before testing: **more than ${report.options.relativeThreshold*100}% AND ${report.options.absoluteThresholdMs} ms slower**. Initially flagged cases receive ${report.options.recheckSamples} additional interleaved samples per engine. Both initial and confirmation measurements are retained. Acceptance: overall aggregate speed-up of at least 1.05×, no geometry/error mismatches, no new failures, no confirmed regressions. **${s.accepted?'PASS':'FAIL'}**. This is an empirical gate, not a proof of universal dominance.\n`;
 }
 text+='\n## By surface style\n\n';
 text+=comparison?'| Surface | Successful cases | v1 median | Candidate median | Aggregate speed-up | Confirmed regressions |\n|---|---:|---:|---:|---:|---:|\n':'| Surface | Successful cases | Median | P95 | Slowest |\n|---|---:|---:|---:|---:|\n';
 for(const [type,name]of ['Fine scales','Layered scales','Crosshatch','Linear'].entries()){
  const rows=report.rows.filter(r=>r.scaleType===type&&(comparison?r.equivalent&&r.baseline.status==='ok'&&r.candidate.status==='ok':r.result.status==='ok'));
  const a=distribution(rows.map(r=>(comparison?r.baseline:r.result).medianMs));
  if(comparison){const b=distribution(rows.map(r=>r.candidate.medianMs));text+=`| ${name} | ${rows.length} | ${rounded(a.p50)} ms | ${rounded(b.p50)} ms | ${rounded(a.sum/b.sum)}× | ${rows.filter(r=>r.classification==='regression').length} |\n`;}
  else text+=`| ${name} | ${rows.length} | ${rounded(a.p50)} ms | ${rounded(a.p95)} ms | ${rounded(a.max)} ms |\n`;
 }
 text+='\n## By surface and pattern\n\n';
 text+=comparison?'| Surface / pattern | Cases | v1 median | Candidate median | Aggregate speed-up | Confirmed regressions |\n|---|---:|---:|---:|---:|---:|\n':'| Surface / pattern | Cases | Median | P95 | Slowest |\n|---|---:|---:|---:|---:|\n';
 for(const [scale,surface]of ['Fine','Layered','Crosshatch','Linear'].entries())for(const [pattern,name]of ['None','Spots','Mottled','Stripes','Speckles'].entries()){
  const rows=report.rows.filter(r=>r.scaleType===scale&&r.patternType===pattern&&(comparison?r.equivalent&&r.baseline.status==='ok'&&r.candidate.status==='ok':r.result.status==='ok'));
  const a=distribution(rows.map(r=>(comparison?r.baseline:r.result).medianMs));
  if(comparison){const b=distribution(rows.map(r=>r.candidate.medianMs));text+=`| ${surface} / ${name} | ${rows.length} | ${rounded(a.p50)} ms | ${rounded(b.p50)} ms | ${rounded(a.sum/b.sum)}× | ${rows.filter(r=>r.classification==='regression').length} |\n`;}
  else text+=`| ${surface} / ${name} | ${rows.length} | ${rounded(a.p50)} ms | ${rounded(a.p95)} ms | ${rounded(a.max)} ms |\n`;
 }
 text+='\n## Coverage\n\n| Block | Cases |\n|---|---:|\n';
 for(const [group,count]of Object.entries(report.coverage.groups))text+=`| ${group} | ${count} |\n`;
 text+=`\nEvery legal position of every control is present. The categorical block covers all **480** combinations of 4 surface styles × 5 patterns × 6 tails × 2 body contours × 2 dorsal textures. The stratified block balances each control across its discrete values; boundary cases include simultaneous endpoint settings. Each case has a reproducible seed.\n`;
 if(comparison){
  text+='\n## Largest final slowdowns / smallest gains\n\n| Case | Block | v1 median | Candidate median | Candidate change | Confirmation samples |\n|---|---|---:|---:|---:|---:|\n';
  const valid=report.rows.filter(r=>r.equivalent&&r.baseline.status==='ok'&&r.candidate.status==='ok');
  const key=r=>(r.recheck?.candidate||r.candidate).medianMs/(r.recheck?.baseline||r.baseline).medianMs;
  for(const r of valid.sort((a,b)=>key(b)-key(a)).slice(0,15)){const a=r.recheck?.baseline||r.baseline,b=r.recheck?.candidate||r.candidate;text+=`| ${r.id} | ${r.group} | ${rounded(a.medianMs)} ms | ${rounded(b.medianMs)} ms | ${((key(r)-1)*100).toFixed(2)}% | ${r.recheck?report.options.recheckSamples:0} |\n`;}
 }
 text+='\n## Interpretation and reproducibility\n\nThe corpus samples the frozen V2 parameter domain. It does not enumerate all combinations, all seeds, unrestricted library inputs, browsers or devices. Global statistics describe this deliberately structured corpus, not a claim about normal user traffic. CPU scheduling, JIT compilation, thermal conditions and garbage collection affect wall time. Compare like-for-like on the same machine and retain the raw case measurements.\n\nThe adjacent JSON contains every timing, output fingerprint, error and confirmation run. The CSV provides a spreadsheet-friendly view. `benchmarks/corpus.json` maps IDs to seeds and parameter indices; `parameter-space.json` maps those indices to exact values. See `benchmarks/README.md` for commands.\n';
 return text;
}
function renderCsv(report){
 const comparison=report.mode==='compare';
 const rows=comparison?[['id','group','scale_type','pattern_type','baseline_median_ms','candidate_median_ms','classification','equivalent','baseline_samples_ms','candidate_samples_ms','confirmation_baseline_ms','confirmation_candidate_ms','baseline_hash_or_error','candidate_hash_or_error']]:[['id','group','scale_type','pattern_type','status','median_ms','samples_ms','hash_or_error']];
 for(const r of report.rows){if(comparison)rows.push([r.id,r.group,r.scaleType,r.patternType,r.baseline.medianMs,r.candidate.medianMs,r.classification,r.equivalent,r.baseline.samplesMs.join(';'),r.candidate.samplesMs.join(';'),r.recheck?.baseline.samplesMs.join(';')||'',r.recheck?.candidate.samplesMs.join(';')||'',r.baseline.hash||r.baseline.error,r.candidate.hash||r.candidate.error]);else rows.push([r.id,r.group,r.scaleType,r.patternType,r.result.status,r.result.medianMs,r.result.samplesMs.join(';'),r.result.hash||r.result.error]);}
 return rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
}
module.exports={summarize,renderMarkdown,renderCsv};
