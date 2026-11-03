# FrankFish

FrankFish builds on [Fishdraw](https://github.com/LingDong-/fishdraw) by **Lingdong Huang**, a procedural fish-drawing library written in JavaScript.

The purpose of this repository is to make fish generation faster, especially for interactive controls. Future work will investigate reusing unchanged geometry when a single parameter changes, reducing unnecessary calculations, and measuring generation time while preserving drawing quality and deterministic results.

**Current status:** the original `fishdraw.js` remains unchanged. `FishDraw_Fast.js` is the v2 clipping version: it combines direct coordinate arguments and fixed-arity intersection keys with prepared edge bounds for finite clipping tests and lazy polygon-union keys. The public API and random-number sequence are preserved; all 2,048 benchmark configurations produce exactly the same geometry as Fast v1.

## Fast FishDraw

Use the same API with the optimized file:

```js
const {fish, generate_params} = require('./FishDraw_Fast.js');
const polylines = fish(generate_params());
```

The original and Fast engines can be compared with identical seeds and parameters in [Fishdraw Studio V2](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/). The site currently serves the previously deployed Fast v1; repository updates do not deploy it automatically. Both site modes regenerate without a result cache. The Performance section separates the generation calculation from the total time to display. Results vary with parameters, runtime and warm-up; no fixed generation-time guarantee is implied.

## Performance benchmarks

The [benchmark suite](benchmarks/README.md) covers 2,048 distinct configurations with repeated, seeded, uncached generation. The [results index](benchmarks/results/README.md) links the frozen [v1 baseline](benchmarks/results/fast-v1-baseline.md), [paired v1 / v2 comparison](benchmarks/results/fast-v2-clipping.md), and complete JSON/CSV measurements. In this run, v2 was 1.46× faster in aggregate, with median generation time changing from 47.69 to 34.97 ms and exact geometry in every case. Two cases crossed the preset regression threshold, so the strict zero-regression gate remains FAIL; v2 is adopted for the overall improvement. The result is specific to this corpus and runtime.

## Attribution and license

The original code is Copyright (c) 2021 Lingdong Huang and is distributed under the [MIT License](LICENSE). The original copyright and license notice are retained. FrankFish is an independent derivative project and is not presented as an official release by the original author.

## Original Fishdraw documentation

# fishdraw

*procedurally generated fish drawings. [demo](https://fishdraw.glitch.me/)*

![](samples/000020.svg)

- generates all sorts of weird fishes
- outputs polylines (supported format svg, json, csv, etc.)
- full procedural generation, single file no dependencies
- plotter-centric
- export drawing animation:

![](samples/animated.svg)



## usage

basic

```
node fishdraw.js > output.svg
```

specify seed (from a string), speed of drawing and output format:

```
node fishdraw.js --seed "Biggus fishus" --format smil --speed 2 > output.svg
```

- the seed string is used as the name of the fish (printed in the drawing). If unspecified, a random pseudo-Latin name will be auto generated.
- the speed number is used to control the speed of drawing animation. Larger the number is, faster it draws. This option works only with format `smil`.
- format options: `svg` (regular svg), `smil` (animated svg), `csv` (each polyline on a comma-separated line) and `json`.

use as JS library:

```js
const {fish,generate_params} = require('./fishdraw.js');
let polylines = fish(generate_params());
console.log(polylines);
```


## gallery

![](samples/000000.svg)
![](samples/000001.svg)
![](samples/000002.svg)
![](samples/000003.svg)
![](samples/000004.svg)
![](samples/000005.svg)
![](samples/000006.svg)
![](samples/000007.svg)
![](samples/000008.svg)
![](samples/000009.svg)
![](samples/000010.svg)
![](samples/000011.svg)
![](samples/000012.svg)
![](samples/000013.svg)
![](samples/000014.svg)
![](samples/000015.svg)
![](samples/000016.svg)
![](samples/000017.svg)
![](samples/000018.svg)
![](samples/000019.svg)
![](samples/000021.svg)
![](samples/000022.svg)
![](samples/000023.svg)
![](samples/000024.svg)
![](samples/000025.svg)
![](samples/000026.svg)
![](samples/000027.svg)
![](samples/000028.svg)
![](samples/000029.svg)
![](samples/000030.svg)
![](samples/000031.svg)
![](samples/000032.svg)
