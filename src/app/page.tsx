"use client";

import { useState } from "react";
import * as ort from "onnxruntime-web";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("picasso");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelMap: Record<string, string> = {
    picasso: "/models/fast_neural_style-udnie-9.onnx",
    vangogh: "/models/fast_neural_style-mosaic-9.onnx",
    cyberpunk: "/models/fast_neural_style-candy-9.onnx",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setProcessedImage(null);
      setError(null);
    }
  };

  const handleProcessImage = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const modelPath = modelMap[style];
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["wasm"],
      });

      const imgBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(imgBitmap, 0, 0, 224, 224);

      const imgData = ctx.getImageData(0, 0, 224, 224);
      const floatData = new Float32Array(1 * 3 * 224 * 224);

      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const idx = (y * 224 + x) * 4;
          const r = imgData.data[idx] / 255;
          const g = imgData.data[idx + 1] / 255;
          const b = imgData.data[idx + 2] / 255;
          const j = y * 224 + x;
          floatData[j] = r;
          floatData[j + 224 * 224] = g;
          floatData[j + 2 * 224 * 224] = b;
        }
      }

      const inputTensor = new ort.Tensor("float32", floatData, [1, 3, 224, 224]);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[session.inputNames[0]] = inputTensor;

      const output = await session.run(feeds);
      const outputTensor = output[session.outputNames[0]];

      const outCanvas = document.createElement("canvas");
      outCanvas.width = 224;
      outCanvas.height = 224;
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) throw new Error("Failed to get output canvas context");

      const outImageData = outCtx.createImageData(224, 224);
      const outData = outputTensor.data as Float32Array;

      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const j = y * 224 + x;
          const i = j * 4;

          const r = Math.min(255, Math.max(0, outData[j] * 255));
          const g = Math.min(255, Math.max(0, outData[j + 224 * 224] * 255));
          const b = Math.min(255, Math.max(0, outData[j + 2 * 224 * 224] * 255));

          outImageData.data[i] = r;
          outImageData.data[i + 1] = g;
          outImageData.data[i + 2] = b;
          outImageData.data[i + 3] = 255;
        }
      }

      outCtx.putImageData(outImageData, 0, 0);
      setProcessedImage(outCanvas.toDataURL("image/png"));
    } catch (err) {
      console.error(err);
      setError("Processing failed. Make sure the models exist in /public/models/ and inputs match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-indigo-700">
          🎨 WASM ONNX Style Transfer
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2 w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {preview && (
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-600">Preview:</p>
            <img
              src={preview}
              alt="Preview"
              className="mt-2 rounded-lg max-h-60 object-contain border"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Choose Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-2 w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="picasso">Picasso</option>
            <option value="vangogh">Van Gogh</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
        </div>

        <button
          onClick={handleProcessImage}
          disabled={!file || loading}
          className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Processing..." : "Apply Style"}
        </button>

        {error && <div className="text-red-600 text-center text-sm mt-2">{error}</div>}

        {processedImage && (
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-600">Processed Image:</p>
            <img
              src={processedImage}
              alt="Processed"
              className="mt-2 rounded-lg max-h-60 object-contain border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
