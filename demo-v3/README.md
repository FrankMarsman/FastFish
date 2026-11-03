# Frank Fish V3

A browser-sized composition of procedural fish, based on Fishdraw by Lingdong Huang and the FrankFish Fast generator. This is a separate experiment from Studio V2.

[Open Frank Fish V3](https://frank-fish-v3.frankmarsman.chatgpt.site/)

- **Fish count** sets a target from 50 to 5,000. The composition prioritizes filling the available area; the status reports how many fish fit.
- **Gap** sets the minimum space between silhouettes, in screen pixels. Raster rounding adds a small safety margin.

Fish have mixed sizes, upright left/right orientations and gentle tilts. They remain inside the viewport and below the controls. Generation and arrangement run in a worker. Settings apply after a 250 ms pause; old artwork remains visible until the replacement is ready. Gap changes and resizing reuse the fish already generated during this page visit.

The live site is published separately from V2. This folder is buildless: serve its `dist/` directory over HTTP. No network dependencies are needed at runtime. Modern browser support for workers, OffscreenCanvas and ImageBitmap is required.

```sh
python3 -m http.server 8000 --directory dist
```

## Geometry and packing

The isolated generator preserves `fish(params)` and adds `fishWithSilhouette(params, seed)`, returning `{lines, parts, bounds}`. Each silhouette part has filled polygons and optional cutout polygons. The generator's large head clipping polygon is a cutout, never a filled silhouette. Visible strokes protect fine details. Silhouette collection uses the same generation pass and introduces no extra random calls.

Raster silhouettes are prepared once per fish at sufficient resolution for its display scale, rotated/mirrored, and conservatively expanded by half the gap plus a pixel allowance. Coarse occupancy cells skip empty regions; row bitsets validate placement. Promising placements receive an additional mask rendered directly from the original line geometry at its final display scale, protecting fine strokes from resampling loss. Larger fish are tried first, followed by bounded smaller-size and gap-filling passes. Final line art is drawn from the original polylines at up to 2× display resolution. This is an approximate layout, not a guaranteed optimal packing.

## Verification

From this folder, supply the original Fast generator path when it is not in the parent directory:

```sh
node tests/geometry.cjs ../FishDraw_Fast.js
node tests/packing.cjs
node tests/controller.cjs
```

`geometry.cjs` checks 120 exact drawing comparisons across all scale, pattern and tail styles, with finlets and protruding details. `packing.cjs` checks collision results against an independent pixel-array reference. `controller.cjs` checks debounce, cancellation, stale responses, retaining artwork and worker-error retry.

Serve this whole folder and open `tests/browser.html` for real-generation cases at 100, 500 and 2,000 fish, small/large gaps and desktop/mobile dimensions. `tests/coverage.html` additionally checks that rendered ink is covered by the collision masks. Tests check occupancy independently of the bitset placement code and verify geometry-cache reuse.

To rebuild the instrumented V3 generator from the unchanged root Fast library:

```sh
node instrument.cjs ../FishDraw_Fast.js
```

Original fish system: Copyright (c) 2021 Lingdong Huang. MIT license in `dist/vendor/LICENSE`. FrankFish adds generator optimizations and this composition interface.

## Composition gallery

The main repository README includes four full-resolution PNG compositions, from 500 × 375 to 2,000 × 1,500 pixels, with targets from 500 to 5,000 fish. Every image uses a 4 px gap and the same deterministic fish collection. The placed count can be lower than the target.

To regenerate all four images in a single browser loop, run this server from this folder, then open the printed URL:

```sh
python3 tools/render-gallery.py
```

The page generates through the production worker, reuses the growing geometry cache, validates separation, containment and rendered-stroke coverage, and saves PNG files plus `manifest.json` into `media/gallery/`. Generated gallery files are overwritten when rerun. The images contain artwork only; controls are omitted and no top control margin is reserved.

Drawing polylines are retained in packed Float64 coordinate buffers, preserving exact values while reducing memory use for collections of up to 5,000 fish.
