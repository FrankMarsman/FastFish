# Original Fishdraw vs FrankFish Fast v2

This comparison measures **`fish(params)` only**, using the unchanged root `fishdraw.js` and the current root `FishDraw_Fast.js` with clipping optimizations. It does not compare Fast v1 against v2; that larger experiment is documented separately in the benchmark folder.

| Style | Original median | Fast v2 median | Original / Fast |
| --- | ---: | ---: | ---: |
| Layered scales (Studio defaults) | 531.9 ms | 37.3 ms | 14.3× |
| Fine scales | 1,399.2 ms | 106.7 ms | 13.1× |
| Crosshatch | 202.4 ms | 16.8 ms | 12.0× |
| Linear | 117.0 ms | 9.6 ms | 12.2× |

Measured 2026-11-03 on Apple M1 / macOS Darwin 23.6.0 / arm64 / Node.js v24.1.0 / V8 13.6.233.10-node.16.

Each case uses three warm-up runs and seven measured runs per engine. Execution order alternates between original-first and Fast-first. Timing starts immediately before `fish(params)` and stops immediately after it returns. Seed resetting, parameter copying, geometry hashing, cleanup, SVG conversion, worker startup and browser display are outside this measurement.

The seed is `Franky fishus`. Parameters are Studio defaults snapped to its discrete control values; only `scale_type` changes between these four cases. Every measured run is deterministic, and full-precision binary geometry hashes match between engines for all four cases. These representative results do not imply the same speed-up or a 40 ms maximum for every configuration or device.

[Raw JSON with all samples, exact parameters, geometry hashes and engine hashes](original-vs-fast-v2.json).

Reproduce from the repository root (no package installation required):

```sh
node benchmarks/compare-original.cjs benchmarks/results/my-original-comparison.json
```

The runner refuses to overwrite an existing result and asserts exact geometry equivalence. It reports measurements without a machine-dependent timing threshold.
