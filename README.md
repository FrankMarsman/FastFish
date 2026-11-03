# FrankFish

FrankFish builds on [Fishdraw](https://github.com/LingDong-/fishdraw) by **Lingdong Huang**, a procedural fish-drawing library written in JavaScript.

The purpose of this repository is to make fish generation faster, especially for interactive controls. Future work will investigate reusing unchanged geometry when a single parameter changes, reducing unnecessary calculations, and measuring generation time while preserving drawing quality and deterministic results.

**Current status:** the original `fishdraw.js` remains unchanged. `FishDraw_Fast.js` provides a compatible optimized version using direct coordinate arguments in intersection calls and fixed-arity intersection keys. Drawing algorithms, exports and the random-number sequence are preserved.

## Fast FishDraw

Use the same API with the optimized file:

```js
const {fish, generate_params} = require('./FishDraw_Fast.js');
const polylines = fish(generate_params());
```

The original and Fast engines can be compared with identical seeds and parameters in [Fishdraw Studio V2](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/). Both modes regenerate without a result cache. The Performance section separates the generation calculation from the total time to display. Results vary with parameters, runtime and warm-up; no fixed generation-time guarantee is implied.

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
