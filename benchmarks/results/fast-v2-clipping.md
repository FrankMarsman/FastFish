# Clipping comparison

Measured **FishDraw_Fast.js**, not the original fishdraw.js. Metric: uncached `fish(params)` generation only. Cleanup, SVG conversion, workers, transport and painting are excluded.

- UTC run: 2026-11-03T16:50:18.096Z to 2026-11-03T17:00:46.722Z
- Runtime: v24.1.0, V8 13.6.233.10-node.16; Apple M1, arm64, darwin
- Corpus: 2048 configurations; 3 samples per engine/case; 32 global warm-up draws per engine
- Corpus SHA-256: `45451d3bf0be813323daf48fe9a6e2bc1c9adb757369b0d56a13d13e0d49d4d1`
- Harness SHA-256: `a2e128fd669ed306a93537d9c665cf47168c1240d3df90ad5515c854ca9da50d`
- baseline: `benchmarks/baselines/FishDraw_Fast.v1.js`, Git blob `fc3a45ce28c262e0fa21e4556792ffa91cc8d5f5`, SHA-256 `17d1595d0404f20c9601da1f05f3e3f8c7960c051d461e3b0c70ba8c563f88ac`
- candidate: `benchmarks/candidates/FishDraw_Fast.v2-clipping.js`, Git blob `214ead3b551ec7c23116e06080d9dcce0da3c775`, SHA-256 `92319801c2c3e52319f21cc8cc09513794b219171d4ef498098b69399e75d8f0`

## Results

| Per-case median distribution | Frozen v1 | Clipping candidate |
|---|---:|---:|
| Median | 47.69 ms | 34.97 ms |
| P90 | 104.43 ms | 68.71 ms |
| P95 | 154.83 ms | 93.64 ms |
| P99 | 311.13 ms | 189.91 ms |
| Slowest | 2048.63 ms | 1012.22 ms |
| Sum across cases | 118937.64 ms | 81500.11 ms |

Successful: **2048/2048**. Cases with errors or invalid geometry: **0**; these remain in the raw results and are excluded from successful-generation timing summaries.

Aggregate speed-up (sum of matched per-case medians): **1.46×**.

| Check | Count |
|---|---:|
| Exact geometry/error mismatches | 0 |
| New failures | 0 |
| Improvements beyond threshold | 1991 |
| Within threshold | 55 |
| Initially flagged regressions | 9 |
| Confirmed regressions | 2 |
| Strictly slower final medians, including tiny differences | 7 |

Regression threshold, chosen before testing: **more than 5% AND 0.25 ms slower**. Initially flagged cases receive 7 additional interleaved samples per engine. Both initial and confirmation measurements are retained. Acceptance: overall aggregate speed-up of at least 1.05×, no geometry/error mismatches, no new failures, no confirmed regressions. **FAIL**. This is an empirical gate, not a proof of universal dominance.

## By surface style

| Surface | Successful cases | v1 median | Candidate median | Aggregate speed-up | Confirmed regressions |
|---|---:|---:|---:|---:|---:|
| Fine scales | 400 | 90.23 ms | 51.47 ms | 1.80× | 0 |
| Layered scales | 865 | 48.93 ms | 36.36 ms | 1.33× | 1 |
| Crosshatch | 384 | 24.77 ms | 19.13 ms | 1.22× | 0 |
| Linear | 399 | 14.82 ms | 11.26 ms | 1.22× | 1 |

## By surface and pattern

| Surface / pattern | Cases | v1 median | Candidate median | Aggregate speed-up | Confirmed regressions |
|---|---:|---:|---:|---:|---:|
| Fine / None | 82 | 85.29 ms | 43.60 ms | 1.92× | 0 |
| Fine / Spots | 78 | 80.78 ms | 50.39 ms | 1.66× | 0 |
| Fine / Mottled | 70 | 90.80 ms | 48.86 ms | 1.86× | 0 |
| Fine / Stripes | 82 | 76.14 ms | 42.51 ms | 1.90× | 0 |
| Fine / Speckles | 88 | 139.66 ms | 85.35 ms | 1.73× | 0 |
| Layered / None | 80 | 36.76 ms | 26.44 ms | 1.37× | 0 |
| Layered / Spots | 77 | 54.82 ms | 45.55 ms | 1.18× | 0 |
| Layered / Mottled | 69 | 36.53 ms | 27.68 ms | 1.33× | 1 |
| Layered / Stripes | 554 | 49.01 ms | 36.44 ms | 1.34× | 0 |
| Layered / Speckles | 85 | 66.52 ms | 47.99 ms | 1.39× | 0 |
| Crosshatch / None | 80 | 16.02 ms | 12.43 ms | 1.29× | 0 |
| Crosshatch / Spots | 78 | 64.05 ms | 59.05 ms | 1.07× | 0 |
| Crosshatch / Mottled | 82 | 22.29 ms | 17.07 ms | 1.32× | 0 |
| Crosshatch / Stripes | 71 | 22.49 ms | 17.25 ms | 1.33× | 0 |
| Crosshatch / Speckles | 73 | 43.60 ms | 32.15 ms | 1.36× | 0 |
| Linear / None | 81 | 7.52 ms | 5.74 ms | 1.32× | 0 |
| Linear / Spots | 74 | 61.66 ms | 59.05 ms | 1.05× | 1 |
| Linear / Mottled | 86 | 13.71 ms | 10.40 ms | 1.31× | 0 |
| Linear / Stripes | 81 | 14.16 ms | 10.42 ms | 1.33× | 0 |
| Linear / Speckles | 77 | 41.18 ms | 30.17 ms | 1.39× | 0 |

## Coverage

| Block | Cases |
|---|---:|
| neighbourhood | 496 |
| categorical | 465 |
| boundaries | 32 |
| stratified | 1055 |

Every legal position of every control is present. The categorical block covers all **480** combinations of 4 surface styles × 5 patterns × 6 tails × 2 body contours × 2 dorsal textures. The stratified block balances each control across its discrete values; boundary cases include simultaneous endpoint settings. Each case has a reproducible seed.

## Largest final slowdowns / smallest gains

| Case | Block | v1 median | Candidate median | Candidate change | Confirmation samples |
|---|---|---:|---:|---:|---:|
| lhs-0016 | stratified | 95.21 ms | 115.13 ms | 20.92% | 7 |
| matrix-1-2-5-1-0 | categorical | 29.52 ms | 32.24 ms | 9.24% | 7 |
| one-teeth_space-7 | neighbourhood | 55.27 ms | 57.28 ms | 3.64% | 0 |
| one-jaw_size-0 | neighbourhood | 53.12 ms | 54.16 ms | 1.96% | 0 |
| one-head_texture_amount-8 | neighbourhood | 51.77 ms | 52.48 ms | 1.38% | 0 |
| lhs-0733 | stratified | 426.73 ms | 427.80 ms | 0.25% | 0 |
| lhs-0824 | stratified | 93.19 ms | 93.22 ms | 0.03% | 0 |
| one-moustache_length-3 | neighbourhood | 76.56 ms | 76.38 ms | -0.23% | 0 |
| lhs-0404 | stratified | 181.98 ms | 181.34 ms | -0.35% | 0 |
| matrix-3-1-4-1-1 | categorical | 53.71 ms | 53.40 ms | -0.59% | 0 |
| one-teeth_length-15 | neighbourhood | 49.21 ms | 48.73 ms | -0.97% | 0 |
| one-eye_size-9 | neighbourhood | 63.87 ms | 63.18 ms | -1.09% | 0 |
| lhs-0251 | stratified | 82.86 ms | 81.95 ms | -1.10% | 0 |
| lhs-0167 | stratified | 104.66 ms | 103.19 ms | -1.41% | 0 |
| lhs-0809 | stratified | 97.78 ms | 96.40 ms | -1.41% | 0 |

## Interpretation and reproducibility

The corpus samples the frozen V2 parameter domain. It does not enumerate all combinations, all seeds, unrestricted library inputs, browsers or devices. Global statistics describe this deliberately structured corpus, not a claim about normal user traffic. CPU scheduling, JIT compilation, thermal conditions and garbage collection affect wall time. Compare like-for-like on the same machine and retain the raw case measurements.

The adjacent JSON contains every timing, output fingerprint, error and confirmation run. The CSV provides a spreadsheet-friendly view. `benchmarks/corpus.json` maps IDs to seeds and parameter indices; `parameter-space.json` maps those indices to exact values. See `benchmarks/README.md` for commands.
