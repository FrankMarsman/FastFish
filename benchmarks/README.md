# Reproducible FishDraw_Fast.js benchmarks

This suite measures **FishDraw_Fast.js**, the optimized procedural generator. It does not time the original `fishdraw.js`, browser rendering, worker startup or cached fish retrieval.

## Run

Requires Node.js with `performance.now()` (tested with Node 24). No dependencies are required. Run from the repository root:

```sh
node benchmarks/test.cjs
node benchmarks/run.cjs --mode baseline --engine FishDraw_Fast.js --out benchmarks/results/my-baseline
node benchmarks/run.cjs --mode compare --baseline benchmarks/baselines/FishDraw_Fast.v1.js --candidate FishDraw_Fast.js --golden benchmarks/results/fast-v1-baseline.json --out benchmarks/results/my-comparison
```

`--out` is a new file prefix. Existing final results are never overwritten. Each completed run writes a readable `.md` report, full `.json` measurements and a `.csv` table. A `.partial.json` checkpoint is updated every 64 cases; an interrupted run is not presented as complete. New runs regenerate the deterministic `benchmarks/corpus.json` manifest.

For a short harness check, use `--limit 8 --samples 1 --warmups 2` and a separate output prefix. Short runs are not substitutes for the full corpus. `--samples`, `--warmups` and `--recheck` can be specified explicitly; their values are recorded.

## Frozen v1 reference

`baselines/FishDraw_Fast.v1.js` is an exact copy of the first published Fast generator:

- GitHub source commit containing it: `eb2df863ed34760d00d52513c4b6ad844a1ad187`.
- Git blob SHA: `fc3a45ce28c262e0fa21e4556792ffa91cc8d5f5`.
- SHA-256: `17d1595d0404f20c9601da1f05f3e3f8c7960c051d461e3b0c70ba8c563f88ac`.

Keep this file unchanged. The live website remains an independently deployed copy; repository benchmark updates do not automatically deploy it.

## Corpus

There are **2,048 distinct parameter vectors**, each with a reproducible drawing seed:

| Block | Distinct cases |
|---|---:|
| Default fish and every legal single-parameter variation | 496 |
| Additional categorical combinations | 465 |
| Simultaneous parameter boundaries | 32 |
| Discrete Latin-hypercube samples | 1,055 |

The first two blocks together cover all 480 combinations of scale style, pattern, tail, body contour and dorsal texture. Every position of all 49 controls appears. Within the stratified block, each control's positions have counts differing by at most one. Duplicate parameter vectors are removed across blocks. Boundary and categorical duplicates are already represented in earlier blocks.

`parameter-space.json` freezes V2's exact control values and snapped defaults. `corpus.cjs` uses its own seeded PRNG, independently of the drawing engine, so changing the generator cannot change the workload. The saved manifest records each case's ID, block, seed and 49 parameter indices. Resolve indices through `parameter-space.json` to recover exact values. Source, corpus and harness hashes are included in each result.

This is a structured coverage suite. It does not exhaust the vastly larger Cartesian product of all settings and seeds, unrestricted library arguments, every JavaScript runtime or every device. Aggregate results describe the corpus, not real-world slider usage frequency.

## Measurement and correctness

The default run performs 32 varied warm-up draws per engine, then three timed samples per case. Each sample resets the seeded PRNG and Perlin state and passes a fresh parameter copy. The timer surrounds `fish(params)` only. Source loading, parameter copying, validation and hashing happen outside the timed interval. The source is evaluated as ordinary JavaScript in a normal function scope, without a slower VM context. Private seed access is appended by the harness; source files and public exports are not altered.

Every generated drawing is validated and fingerprinted using full 64-bit coordinate values and polyline boundaries, including signed zero. Repeated samples must be deterministic. Generation exceptions and invalid geometry remain recorded as failures; they are not silently replaced or discarded. Failed cases are excluded only from successful-generation latency summaries.

A comparison reruns both the frozen baseline and candidate on the same inputs and process, alternating A/B and B/A order by case and repeat. Baseline identities must also match the saved golden baseline. The saved golden timings are not substituted for fresh paired measurements.

## Gate chosen before testing

- Geometry/error identities must match in every case, with no new failures.
- A regression means more than **5% AND 0.25 ms** slower on per-case medians.
- Every initially flagged regression receives **seven additional samples per engine**, again with alternating order. Initial and confirmation data are both retained.
- Acceptance requires no confirmed regressions and an aggregate speed-up of at least **1.05×** across successful matched cases.
- The report also counts **all strictly slower final medians**, including differences below the regression threshold, and lists the worst cases.

This gate describes empirical evidence, not a mathematical guarantee that no input can ever be slower. CPU scheduling, thermal changes, JIT compilation, garbage collection and measurement overhead remain sources of variation. Keep heavy background workloads closed and compare on the same machine. No fish-result caching, preview simplification or geometry-quality reduction is involved.

## Reports

Start with `results/fast-v1-baseline.md`. Candidate comparisons are added under new prefixes so the baseline and rejected experiments remain inspectable. Raw JSON and CSV contain every case measurement and failure; no outlier timing is trimmed.
