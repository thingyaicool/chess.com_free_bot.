# Stockfish Engine Assets

This directory should contain the Stockfish WebAssembly build files.

## Required Files

1. `stockfish.js` — The JavaScript loader/glue code
2. `stockfish.wasm` — The WebAssembly binary
3. `stockfish.worker.js` — The Web Worker wrapper

## How to Obtain

### Option A: From npm (recommended)

```bash
cd ../..
npm install stockfish
cp node_modules/stockfish/src/engine/stockfish.js ./
cp node_modules/stockfish/src/engine/stockfish.wasm ./
cp node_modules/stockfish/src/engine/stockfish.worker.js ./
```

### Option B: From CDN

Download from: https://cdn.jsdelivr.net/npm/stockfish/src/engine/

### Option C: Build from source

See: https://github.com/official-stockfish/stockfish

## License

Stockfish is licensed under GPL-3.0.
https://stockfishchess.org/
