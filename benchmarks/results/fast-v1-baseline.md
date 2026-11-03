# FishDraw_Fast.js v1 baseline

Measured **FishDraw_Fast.js**, not the original fishdraw.js. Metric: uncached `fish(params)` generation only. Cleanup, SVG conversion, workers, transport and painting are excluded.

- UTC run: 2026-11-03T16:41:20.209Z to 2026-11-03T16:46:07.421Z
- Runtime: v24.1.0, V8 13.6.233.10-node.16; Apple M1, arm64, darwin
- Corpus: 2048 configurations; 3 samples per engine/case; 32 global warm-up draws per engine
- Corpus SHA-256: `45451d3bf0be813323daf48fe9a6e2bc1c9adb757369b0d56a13d13e0d49d4d1`
- Harness SHA-256: `a2e128fd669ed306a93537d9c665cf47168c1240d3df90ad5515c854ca9da50d`
- baseline: `FishDraw_Fast.js`, Git blob `fc3a45ce28c262e0fa21e4556792ffa91cc8d5f5`, SHA-256 `17d1595d0404f20c9601da1f05f3e3f8c7960c051d461e3b0c70ba8c563f88ac`

## Results

| Per-case median distribution | FishDraw_Fast.js v1 |
|---|---:|
| Median | 42.83 ms |
| P90 | 76.51 ms |
| P95 | 111.28 ms |
| P99 | 232.75 ms |
| Slowest | 1356.57 ms |
| Sum across cases | 93678.78 ms |

Successful: **2048/2048**. Cases with errors or invalid geometry: **0**; these remain in the raw results and are excluded from successful-generation timing summaries.

## By surface style

| Surface | Successful cases | Median | P95 | Slowest |
|---|---:|---:|---:|---:|
| Fine scales | 400 | 61.24 ms | 199.76 ms | 1356.57 ms |
| Layered scales | 865 | 44.69 ms | 73.94 ms | 283.69 ms |
| Crosshatch | 384 | 20.44 ms | 58.62 ms | 275.00 ms |
| Linear | 399 | 12.41 ms | 69.94 ms | 360.18 ms |

## By surface and pattern

| Surface / pattern | Cases | Median | P95 | Slowest |
|---|---:|---:|---:|---:|
| Fine / None | 82 | 54.58 ms | 197.57 ms | 1356.57 ms |
| Fine / Spots | 78 | 53.03 ms | 124.03 ms | 253.42 ms |
| Fine / Mottled | 70 | 62.38 ms | 205.57 ms | 373.39 ms |
| Fine / Stripes | 82 | 50.02 ms | 159.62 ms | 1203.91 ms |
| Fine / Speckles | 88 | 106.49 ms | 282.74 ms | 911.76 ms |
| Layered / None | 80 | 33.00 ms | 59.04 ms | 103.78 ms |
| Layered / Spots | 77 | 45.49 ms | 90.94 ms | 147.77 ms |
| Layered / Mottled | 69 | 34.74 ms | 74.10 ms | 88.58 ms |
| Layered / Stripes | 554 | 44.79 ms | 54.81 ms | 88.77 ms |
| Layered / Speckles | 85 | 61.04 ms | 144.33 ms | 283.69 ms |
| Crosshatch / None | 80 | 14.04 ms | 22.01 ms | 28.34 ms |
| Crosshatch / Spots | 78 | 44.23 ms | 113.31 ms | 275.00 ms |
| Crosshatch / Mottled | 82 | 18.66 ms | 32.26 ms | 50.84 ms |
| Crosshatch / Stripes | 71 | 18.11 ms | 31.93 ms | 44.97 ms |
| Crosshatch / Speckles | 73 | 40.30 ms | 88.29 ms | 147.81 ms |
| Linear / None | 81 | 6.51 ms | 10.35 ms | 14.31 ms |
| Linear / Spots | 74 | 42.34 ms | 79.46 ms | 125.67 ms |
| Linear / Mottled | 86 | 11.15 ms | 19.08 ms | 28.02 ms |
| Linear / Stripes | 81 | 11.00 ms | 17.64 ms | 21.77 ms |
| Linear / Speckles | 77 | 38.13 ms | 121.47 ms | 360.18 ms |

## Coverage

| Block | Cases |
|---|---:|
| neighbourhood | 496 |
| categorical | 465 |
| boundaries | 32 |
| stratified | 1055 |

Every legal position of every control is present. The categorical block covers all **480** combinations of 4 surface styles × 5 patterns × 6 tails × 2 body contours × 2 dorsal textures. The stratified block balances each control across its discrete values; boundary cases include simultaneous endpoint settings. Each case has a reproducible seed.

## Interpretation and reproducibility

The corpus samples the frozen V2 parameter domain. It does not enumerate all combinations, all seeds, unrestricted library inputs, browsers or devices. Global statistics describe this deliberately structured corpus, not a claim about normal user traffic. CPU scheduling, JIT compilation, thermal conditions and garbage collection affect wall time. Compare like-for-like on the same machine and retain the raw case measurements.

The adjacent JSON contains every timing, output fingerprint, error and confirmation run. The CSV provides a spreadsheet-friendly view. `benchmarks/corpus.json` maps IDs to seeds and parameter indices; `parameter-space.json` maps those indices to exact values. See `benchmarks/README.md` for commands.
