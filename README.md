# FrankFish

Detailed fish drawings, made with JavaScript. FrankFish builds on **[Fishdraw by Lingdong Huang](https://github.com/LingDong-/fishdraw)**, keeping its intricate line art and compatible API while making generation much faster.

**[Try Frank Fish in your browser →](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/)** · [Download the demo](https://raw.githubusercontent.com/FrankMarsman/FrankFish/main/demo/index.html) · [Use the library](#use-the-library)

## Animated samples

Twenty fish, each morphing into a different shape. Click any animation to open it on its own.

Within each group: fine scales, layered scales, crosshatch and linear.

**Plain**

<p>
<a href="samples/morph-01.gif"><img src="samples/morph-01.gif" alt="01 · Fine scales · Plain: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-02.gif"><img src="samples/morph-02.gif" alt="02 · Layered scales · Plain: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-03.gif"><img src="samples/morph-03.gif" alt="03 · Crosshatch · Plain: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-04.gif"><img src="samples/morph-04.gif" alt="04 · Linear · Plain: a fish morphing between two shapes" width="48%"></a>
</p>

**Spots**

<p>
<a href="samples/morph-05.gif"><img src="samples/morph-05.gif" alt="05 · Fine scales · Spots: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-06.gif"><img src="samples/morph-06.gif" alt="06 · Layered scales · Spots: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-07.gif"><img src="samples/morph-07.gif" alt="07 · Crosshatch · Spots: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-08.gif"><img src="samples/morph-08.gif" alt="08 · Linear · Spots: a fish morphing between two shapes" width="48%"></a>
</p>

**Mottled**

<p>
<a href="samples/morph-09.gif"><img src="samples/morph-09.gif" alt="09 · Fine scales · Mottled: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-10.gif"><img src="samples/morph-10.gif" alt="10 · Layered scales · Mottled: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-11.gif"><img src="samples/morph-11.gif" alt="11 · Crosshatch · Mottled: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-12.gif"><img src="samples/morph-12.gif" alt="12 · Linear · Mottled: a fish morphing between two shapes" width="48%"></a>
</p>

**Stripes**

<p>
<a href="samples/morph-13.gif"><img src="samples/morph-13.gif" alt="13 · Fine scales · Stripes: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-14.gif"><img src="samples/morph-14.gif" alt="14 · Layered scales · Stripes: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-15.gif"><img src="samples/morph-15.gif" alt="15 · Crosshatch · Stripes: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-16.gif"><img src="samples/morph-16.gif" alt="16 · Linear · Stripes: a fish morphing between two shapes" width="48%"></a>
</p>

**Speckles**

<p>
<a href="samples/morph-17.gif"><img src="samples/morph-17.gif" alt="17 · Fine scales · Speckles: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-18.gif"><img src="samples/morph-18.gif" alt="18 · Layered scales · Speckles: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-19.gif"><img src="samples/morph-19.gif" alt="19 · Crosshatch · Speckles: a fish morphing between two shapes" width="48%"></a>
<a href="samples/morph-20.gif"><img src="samples/morph-20.gif" alt="20 · Linear · Speckles: a fish morphing between two shapes" width="48%"></a>
</p>

Each loop uses 25 steps, with the drawing seed and categorical settings held fixed. The gallery covers all four scale styles and five body patterns. [GIF files and how to recreate them →](samples/README.md)

## Generation speed

The Fast generator was **12–14× as fast** as the original in these four examples:

| Style | Original Fishdraw | FrankFish Fast | Speed-up |
| --- | ---: | ---: | ---: |
| Layered scales | 531.9 ms | 37.3 ms | **14.3×** |
| Fine scales | 1,399.2 ms | 106.7 ms | **13.1×** |
| Crosshatch | 202.4 ms | 16.8 ms | **12.0×** |
| Linear | 117.0 ms | 9.6 ms | **12.2×** |

Drawing calculation only, on an Apple M1 with Node.js 24.1.0. Medians of seven runs after three warm-ups, using the same seed and parameters with matching geometry. Results vary by fish and device. [Method and raw results](benchmarks/results/original-vs-fast-v2.md) · [Larger Fast v1/v2 benchmark](benchmarks/README.md)

## Make your own fish

[Open Frank Fish](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/) and start moving the sliders. Rotate a dial or click its labels to choose a style. **New fish** prepares a 25-step transition, then plays it smoothly. You can zoom in, check the drawing times and download your fish as an SVG.

[![The Frank Fish control panel](demo/media/studio-v2.jpg)](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/)

<details>
<summary><strong>See the sliders in action</strong> — body length, body height and tail length</summary>

**Body length**

![Changing body length in Frank Fish](demo/media/body-length-slider.gif)

**Body height**

![Changing body height in Frank Fish](demo/media/body-height-slider.gif)

**Tail length**

![Changing tail length in Frank Fish](demo/media/tail-length-slider.gif)

These are real interface captures, paced for viewing. The gallery and slider GIFs are visual examples, not real-time speed measurements.

</details>

The [standalone demo](https://raw.githubusercontent.com/FrankMarsman/FrankFish/main/demo/index.html) is a single HTML file: save it and open it in a modern browser. It includes the Fast generator and needs no external runtime assets. [Editing and build instructions](demo/README.md)

## Use the library

Clone this repository, then generate a fish with Node.js:

```sh
node FishDraw_Fast.js --seed "Franky fishus" > fish.svg
```

To choose the parameters yourself:

```js
const fs = require('node:fs');
const { fish, default_params, reframe, cleanup, draw_svg } = require('./FishDraw_Fast.js');

const params = { ...default_params(), body_length: 300, scale_type: 2 };
const lines = cleanup(reframe(fish(params), 20, ''));
fs.writeFileSync('fish.svg', draw_svg(lines));
```

`fish(params)` returns polylines; `draw_svg()` turns them into an SVG. The original exports are preserved. The unchanged `fishdraw.js` is included for comparison; use **`FishDraw_Fast.js`** for the faster version.

## Credits and license

The fish drawing system and original artwork are by **Lingdong Huang**. FrankFish adds performance improvements, the interactive studio and these animated examples. Released under the [MIT license](LICENSE), with the original copyright and attribution preserved.
