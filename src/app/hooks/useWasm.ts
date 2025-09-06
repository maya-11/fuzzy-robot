import { useState, useEffect } from "react";

// Define WASM module type
type WasmMath = {
  factorial: (n: number) => number;
};

export default function useWasm() {
  const [wasm, setWasm] = useState<WasmMath | null>(null);

  useEffect(() => {
    async function loadWasm() {
      try {
        // Import the WASM module from pkg
        const wasmModule = await import("@/wasm-math/pkg/wasm_math");
        await wasmModule.default(); // Initialize the WASM module
        setWasm(wasmModule as WasmMath);
      } catch (err) {
        console.error("Failed to load WASM:", err);
      }
    }
    loadWasm();
  }, []);

  return wasm;
}
