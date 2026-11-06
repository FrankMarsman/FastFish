# Fast FishDraw benchmark results

The current repository `FishDraw_Fast.js` is the tested v2 clipping implementation. The frozen v1 source and both complete result sets are retained for repeatable comparisons.

## Reports

- [Fast v1 baseline](fast-v1-baseline.md): [JSON](fast-v1-baseline.json), [CSV](fast-v1-baseline.csv).
- [Paired v1 / v2 clipping comparison](fast-v2-clipping.md): [JSON](fast-v2-clipping.json), [CSV](fast-v2-clipping.csv).
- [Method and commands](../README.md).

## Latest comparison

Measured on an Apple M1 with Node.js 24.1.0. Both engines ran the same 2,048 distinct seeded configurations, with 32 global warm-up draws and three timed samples per engine/case. These are uncached `fish(params)` times; browser rendering and worker overhead are excluded.

| Metric | Fast v1 | Fast v2 clipping |
|---|---:|---:|
| Median of case medians | 47.69 ms | 34.97 ms |
| P95 | 154.83 ms | 93.64 ms |
| P99 | 311.13 ms | 189.91 ms |
| Sum of case medians | 118.94 s | 81.50 s |

The aggregate speed-up is **1.46×**, or **31.5% less generation time** across the paired corpus. All **2,048/2,048** outputs match exactly at full coordinate precision, with no failures. The separate clipping checks cover 3,600 line probes plus polygon-union and fallback checks.

## Adoption and limits

V2 is adopted for its overall improvement and preserved drawing output. The stricter gate specified before testing still reports **FAIL**: two configurations crossed its confirmed-regression threshold. There were 1,991 improvements beyond the threshold, 55 results within it, and two confirmed regressions. All raw measurements, including the seven additional confirmation samples for initially flagged cases, remain available.

The saved gate has not been changed to make this an all-input speed claim. This structured corpus covers every control position and all 480 selected categorical combinations; it cannot exhaust every combination or seed. Timings also depend on runtime and machine conditions. A 35 ms median generation time does not guarantee a 40 ms browser display time or continuous frame rate.

The root engine is byte-identical to `candidates/FishDraw_Fast.v2-clipping.js` (Git blob `214ead3b551ec7c23116e06080d9dcce0da3c775`). It adds prepared edge bounds for finite clipping tests and delays polygon-union key construction until intersections exist. Exact intersection calculations, infinite-ray tests and random-number order are preserved.

Website deployments are versioned separately. Benchmark changes do not automatically update the hosted demos; see the [Studio build instructions](../../demo/README.md).
