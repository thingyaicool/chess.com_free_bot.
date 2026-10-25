# Chess Training Assistant

A comprehensive Chrome extension for chess analysis and training, powered by the Stockfish engine running locally in your browser. Designed with a polished dark interface and human-like play randomization.

> **⚠️ Disclaimer:** This extension is built for **educational and training purposes**. Using engine assistance during games on chess.com or similar platforms violates their Terms of Service and may result in account bans. Use responsibly.

## Features

### 🧠 Stockfish Engine Integration
- Real Stockfish engine running as WebAssembly in a Web Worker
- No API keys, no servers, no external services required
- Configurable **Think Time** (0.5s – 30s) and **Depth** (1 – 30)
- Multi-PV analysis showing top candidate moves
- Full UCI protocol support with progress updates

### 📊 Evaluation Bar
- Real-time evaluation display in centipawns (+0.65, -1.20)
- Mate distance indicators (M5, M3, etc.)
- Visual bar with smooth animated transitions
- Sigmoid mapping for natural visual representation

### 🎯 Automatic Move Selection
- **Top N Candidates:** Choose from 1 to 20 best moves
- **Deterministic Mode:** Always plays the engine's best move
- **Weighted Mode:** Probabilistic selection favoring stronger moves
- Illegal move filtering, duplicate prevention
- Handles promotions, castling, en passant correctly

### 📈 Play Strength (Elo-Based)
- Target ratings from 400 to 3000+ Elo
- Uses Stockfish's `UCI_LimitStrength` and `UCI_Elo` options
- **Recommended presets** for each Elo level with descriptions
- Depth and think time adjusted per strength level
- Combines with candidate-move selection for varied play

### 🎲 Advanced Randomization System (Anti-Detection)
- **5 independent categories:** Opening, Timing, Delay, Moves, Accuracy
- **Accuracy targeting:** Set target (e.g., 75%) with ±tolerance
- **Session-adaptive:** Varies move quality to approach target over time
- **Human-like timing:** Random variation in think times (±15-30%)
- **Seeded PRNG** (Mulberry32) for reproducible testing
- **Presets:** Casual (60%), Balanced ★ (75%), Strong (85%), Masterful (93%)
- **Session dashboard:** Target vs. observed accuracy, distribution, trends

### 🔍 Hanging Piece Detection
- Identifies vulnerable pieces for both colors
- Distinguishes between truly hanging and tactically defended pieces
- Color-coded threat levels (low/medium/high/critical)
- Click markers for detailed explanations

### 👤 Opponent Statistics
- Fetches public stats from Chess.com's API
- Shows ratings (bullet, blitz, rapid, daily)
- Win/loss/draw records, total games
- 5-minute cache to avoid rate limits

### 🤖 Automatic Move Execution
- Start/Pause/Stop controls
- Configurable playing side
- Pre-move display before execution
- Status indicators (Analyzing, Ready, Paused, Error)

### 🔄 Auto Next Game
- Automatically starts new games after the current one ends
- Configurable delay, session limits
- Pause on error option

### ⏱️ Move Timing & Natural Pacing
- Configurable min/max move times (decimal seconds)
- Variation percentage for natural feel
- Complexity-based adjustment
- Human-like timing variation to avoid detection patterns

### 📖 Opening Book Recommendations
- Built-in opening book with common positions
- Shows recommended moves with frequency data
- Opening name identification
- Configurable depth (1-10 moves)

## Requirements

- Chrome 100+ or Chromium-based browser (Edge, Brave, Opera)
- Modern computer with WebAssembly support
- ~50MB free disk space for Stockfish WASM

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chess-training-assistant.git
cd chess-training-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Download Stockfish WASM

The extension requires Stockfish WebAssembly files. Place them in `extension/engine/`:

```bash
# Option A: From npm
npm install stockfish
mkdir -p extension/engine
cp node_modules/stockfish/src/engine/stockfish.js extension/engine/
cp node_modules/stockfish/src/engine/stockfish.wasm extension/engine/
cp node_modules/stockfish/src/engine/stockfish.worker.js extension/engine/

# Option B: Manual download from CDN
# https://cdn.jsdelivr.net/npm/stockfish/src/engine/
# Download: stockfish.js, stockfish.wasm, stockfish.worker.js
```

### 4. Generate Icons

```bash
node scripts/generate-icons.js
```

### 5. Build the Extension

```bash
npm run build:extension
```

This compiles TypeScript and bundles all entry points into `extension/dist/`.

### 6. Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` directory
5. The extension icon appears in your toolbar

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start website development server |
| `npm run build` | Build the documentation website |
| `npm run build:extension` | Build the Chrome extension |
| `npm run typecheck` | Type-check the website code |
| `npm run typecheck:extension` | Type-check the extension code |
| `npm test` | Run unit tests |

## Configuration

### Engine Settings
- **Think Time:** Seconds to analyze per move (0.5 – 30s). Recommended: 3s
- **Depth:** Search depth (1 – 30). Recommended: 15
- **Analysis Mode:** Choose between Think Time or Fixed Depth

### Play Strength (Recommended Presets)
| Elo | Depth | Think Time | Accuracy | Description |
|-----|-------|------------|----------|-------------|
| 400 | 2 | 0.5s | 35% | Very Beginner |
| 800 | 4 | 1.5s | 55% | Beginner |
| 1200 | 6 | 2.5s | 68% | Intermediate |
| 1600 ★ | 10 | 3.5s | 78% | Club Player |
| 2000 | 14 | 5.0s | 86% | Advanced |
| 2500 | 18 | 8.0s | 95% | Grandmaster |

### Accuracy Presets
| Preset | Target | Tolerance | Description |
|--------|--------|-----------|-------------|
| Casual | 60% | ±10% | Lots of variety, occasional blunders |
| Balanced ★ | 75% | ±7% | Natural human-like play |
| Strong | 85% | ±5% | Mostly accurate with rare mistakes |
| Masterful | 93% | ±3% | Very precise, few errors |

### Human-Like Play (Anti-Detection)
- **Timing Variation:** ±15-30% random variation in think times
- **Move Selection:** Weighted random from top N candidates
- **Accuracy Adaptation:** Session tracks actual vs. target accuracy
- **Opening Variation:** Selects from multiple book moves
- **Delay Variation:** Independent delay randomization

## Architecture

```
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── popup.html                 # Toolbar popup (compact controls)
├── sidepanel.html             # Side panel (full workspace)
├── dist/                      # Built JS bundles (generated)
│   ├── background.js
│   ├── content.js
│   ├── popup.js
│   └── sidepanel.js
├── src/
│   ├── background.ts          # Service worker
│   ├── content.ts             # Content script
│   ├── popup.ts               # Popup logic
│   ├── sidepanel.ts           # Side panel logic
│   ├── types.ts               # TypeScript definitions
│   └── services/
│       ├── EngineManager.ts       # Stockfish WASM wrapper
│       ├── BoardAdapter.ts        # chess.com DOM interface
│       ├── MoveSelector.ts        # Candidate selection
│       ├── StrengthController.ts  # Elo management
│       ├── TimingController.ts    # Move timing
│       ├── HangingPieceDetector.ts # Vulnerability detection
│       ├── OpponentStatsService.ts # Chess.com API
│       ├── OpeningBookService.ts   # Opening book
│       ├── RandomizationEngine.ts  # Human-like play
│       ├── AutoGameController.ts   # Auto next-game
│       └── SettingsStore.ts        # Persistent settings
├── engine/                    # Stockfish WASM (user-provided)
├── styles/
│   └── content.css            # Overlay styles
└── icons/                     # Extension icons (generated)
```

## Troubleshooting

### Engine Not Loading
- Verify `stockfish.js`, `stockfish.wasm`, `stockfish.worker.js` are in `extension/engine/`
- Check browser console for WebAssembly errors
- Ensure Content Security Policy allows `wasm-unsafe-eval`
- Reload the extension in `chrome://extensions/`

### Board Not Detected
- Ensure you are on a chess.com game page
- Check console for `[CTA]` messages
- The DOM structure may have changed — update selectors in `BoardAdapter.ts`

### Extension Won't Build
- Run `npm install` to ensure all dependencies are present
- Run `npm run typecheck:extension` to check for TypeScript errors
- Ensure Node.js 18+ is installed

### Icons Missing
- Run `node scripts/generate-icons.js` to generate PNG icons
- Icons are placed in `extension/icons/`

## Known Limitations

- Stockfish WASM is limited to single-threaded operation in extensions
- The opening book is a curated subset; not all positions are covered
- chess.com DOM selectors may change with site updates
- Opponent stats depend on Chess.com's public API availability
- Auto-play may not work in all game modes (e.g., puzzles, lessons)
- WebAssembly memory is limited to ~2GB in browsers

## Testing

```bash
# Run unit tests
npm test

# Type-check extension
npm run typecheck:extension

# Build website
npm run build

# Build extension
npm run build:extension
```

## Third-Party Assets & Licenses

- **Stockfish** — GPL-3.0. The world's strongest open-source chess engine.
- **chess.js** — BSD-2-Clause. Chess move generation and validation.
- **Chess.com Public API** — Used for opponent statistics.

## License

MIT License — See [LICENSE](LICENSE) for details.

## Updating

```bash
cd chess-training-assistant
git pull
npm install
npm run build:extension
```

Then reload the extension in `chrome://extensions/`.
