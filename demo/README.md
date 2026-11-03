# Frank Fish demo

**[Open the live demo →](https://franky-fishdraw-studio-v2.frankmarsman.chatgpt.site/)**

The public Frank Fish site is ready to use in your browser.

## Run a local copy

For offline use or development, download `index.html` using GitHub's **Download raw file** button. The generated HTML embeds the CSS, controller, the root Fast generator, worker code and MIT license. Nothing else is needed at runtime.

Open the saved file in a modern browser. If a browser policy restricts local files, serve this directory:

```sh
python3 -m http.server 8000 --directory demo
```

Then open `http://localhost:8000/`.

## Editing and verification

The editable interface lives in `src/`. The interface always uses the current root `FishDraw_Fast.js` (v2). The original library remains in the repository for benchmarks. There is no generator selector or separate Performance panel; the two timings appear inside the fish display. Dials support pointer rotation, clickable labels and arrow keys.

From the repository root, with Node.js 24 or newer:

```sh
node demo/build.cjs
node demo/tests/bundle.cjs
node demo/tests/timing.cjs
node demo/tests/morph.cjs
node demo/tests/dials.cjs
```

The checks cover embedded Fast worker execution and determinism, timing, stale responses, pending slider inputs, generation failures, 25-frame preparation/playback, frozen toggle values and pointer/keyboard dial interaction. The generated file was also checked over local HTTP in a browser. Direct `file://` browser verification was unavailable in the automated browser environment.

No cache is used for ordinary slider changes. New fish temporarily retains all 25 transition frames, plays them only after preparation finishes and releases them afterward. Total draw time includes the display paint opportunity; Fish generation measures the drawing calculation itself.

## Animation examples

`media/layered-morph.gif` and `media/crosshatch-morph.gif` contain actual Fast generator output. `media/morphs.json` records the seed, both endpoint configurations and a shared camera box for every example. The same interpolation rule as the Studio is used, including integer rounding and fixed toggle values.

For the 20 animated samples in the main README, see the [gallery rendering instructions](../samples/README.md).

To regenerate these two earlier examples, install the optional renderer and have FFmpeg on your PATH:

```sh
npm install --no-save @resvg/resvg-js@2.6.2
node demo/render-morphs.cjs
```

Each animation has 25 forward steps and reuses those frames backward, at 20 fps with endpoint pauses. Preparation time is omitted. These are visual examples, not speed measurements. The optional media tools are not needed to build or run the demo.
