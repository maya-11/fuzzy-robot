# In-Browser Neural Style Transfer

Upload a photo and restyle it as a painting, **entirely in your browser**. No server and no uploads: pretrained neural style-transfer models run client-side with ONNX Runtime Web on WebAssembly.

<!-- Add a before/after screenshot here -->

## Tech stack

- **Next.js 15**, **React 19**, **TypeScript**, Tailwind CSS
- **ONNX Runtime Web** (WebAssembly execution provider)
- Pretrained **fast neural style** ONNX models (Mosaic, Udnie)
- A Rust → WebAssembly module set up with `wasm-bindgen` (`wasm/wasm-math`), ready for moving image processing into Rust

## How it works

1. The uploaded image is resized to 224×224.
2. Pixels are converted into a `float32` tensor shaped `[1, 3, 224, 224]`.
3. An ONNX Runtime Web session runs the selected style model.
4. The output tensor is converted back to pixels and shown next to the original.

Because inference happens on the user's device, images never leave the browser.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, upload an image and pick a style.

## Next steps

- Move tensor pre-/post-processing into the Rust/WASM module
- Try the WebGPU execution provider and compare its speed with WASM
