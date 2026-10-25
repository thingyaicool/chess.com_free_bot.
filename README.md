# Chess Training Assistant

A comprehensive Chrome extension for chess analysis and training, powered by the Stockfish engine running locally in your browser.

> **⚠️ Disclaimer:** This extension is built for **educational and training purposes**. Using engine assistance during games on chess.com or similar platforms violates their Terms of Service and may result in account bans. Use responsibly.

## Features

### 🧠 Stockfish Engine Integration
- Real Stockfish engine running as WebAssembly in a Web Worker
- No API keys, no servers, no external services
- Configurable analysis depth (1-30) and thinking time
- Multi-PV analysis showing top candidate moves
- Full UCI protocol support

### 📊 Evaluation Bar
- Real-time evaluation display in centipawns (+0.65, -1.20)
- Mate distance indicators (M5, M3, etc.)
- Visual bar showing which side is winning
- Smooth animated transitions
- Configurable orientation (vertical/horizontal)

### 🎯 Automatic Move Selection
- **Top N Candidates:** Choose from 1 to 20 best moves
- **Deterministic Mode:** Always plays the engine's best move
- **Weighted Mode:** Favors stronger moves with probabilistic selection
- Duplicate prevention and illegal move filtering
- Handles promotions, castling, and en passant correctly

### 📈 Play Strength (Elo-Based)
- Target ratings from 400 to 3000+ Elo
- Uses Stockfish's `UCI_LimitStrength` and `UCI_Elo` options
- Depth and time limits adjusted per strength level
- Presets: Beginner (400) → Grandmaster (2500) → Maximum
- Combines with candidate-move selection for varied play

### 🔍 Hanging Piece Detection
- Identifies vulnerable pieces for both colors
- Distinguishes between truly hanging and tactically defended pieces
- Color-coded threat levels (low/medium/high/critical)
- Click markers for detailed explanations
- Shows attackers, defenders, and material at risk

### 👤 Opponent Statistics
- Fetches public stats from Chess.com's API
- Shows ratings (bullet, blitz, rapid, daily)
- Win/loss/draw records
- 5-minute cache to avoid rate limits
- Manual refresh and last-updated timestamp

### 🤖 Automatic Move Execution
- Start/Pause/Stop controls
- Configurable playing side
- Pre-move display before execution
- Status indicators (Analyzing, Ready, Paused, Error)
- Safe recovery from interrupted actions

### 🔄 Auto Next Game
- Automatically starts new games after the current one ends
- Configurable delay before starting
- Session limits (max games, max duration)
- Pause on error option
- Optional confirmation requirement

### ⏱️ Move Timing & Natural Pacing
- Configurable min/max move times (decimal seconds)
- Variation percentage for natural feel
- Complexity-based adjustment (more time for harder positions)
- Additional configurable delay
- No blocking delays — fully async scheduling

### 🎲 Advanced Randomization System
- **Multi-select categories:** Opening, Timing, Delay, Moves, Accuracy
- **Accuracy targeting:** Set target (e.g., 80%) with ±tolerance
- **Session-adaptive:** Varies move quality to approach target over time
- **Seeded PRNG:** Reproducible results for testing
- **Presets:** Consistent, Balanced, Variable Practice, Custom
- **Session dashboard:** Target vs. observed accuracy, distribution, trends

### 📖 Opening Book Recommendations
- Built-in opening book with common positions
- Shows recommended moves with frequency data
- Opening name identification
- Configurable depth (1-10 moves)
- Distinguishes book moves from engine analysis

## Requirements

- Chrome 88+ or Chromium-based browser (Edge, Brave, Opera)
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

The extension requires a Stockfish WebAssembly build. Download it and place it in the `extension/engine/` directory:

```bash
# Option A: From npm
npm install stockfish
cp node_modules/stockfish/src/engine/* extension/engine/

# Option B: From CDN (manual download)
# Download from: https://cdn.jsdelivr.net/npm/stockfish/src/engine/
# Place stockfish.js, stockfish.wasm, and stockfish.worker.js in extension/engine/
```

### 4. Build the Extension

```bash
npm run build:extension
```

This compiles TypeScript and bundles the extension into `extension/dist/`.

### 5. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` directory
5. The extension icon should appear in your toolbar

## Configuration

### Engine Settings
- **Depth:** Analysis search depth (1-30). Higher = stronger but slower.
- **MultiPV:** Number of candidate lines to calculate.
- **Elo:** Playing strength target. Set to "Maximum" for full strength.
- **Threads:** CPU threads for analysis (1 recommended for extensions).
- **Hash:** Memory allocation in MB.

### Play Strength
- Select from presets (400-2500) or set custom Elo
- Lower Elo = shallower search + less thinking time
- Combines with candidate-move selection
- "Maximum" removes all limits

### Candidate Move Selection
- **Top 1:** Always plays the best move found
- **Top 2-20:** Selects from the N best candidates
- **Deterministic:** Always picks the highest-ranked move
- **Weighted:** Probabilistic selection favoring stronger moves

### Move Timing
- **Min Time:** Minimum seconds before making a move
- **Max Time:** Maximum seconds for analysis
- **Variation:** Random variation percentage
- **Complexity Adjustment:** More time for tactical positions

### Randomization
- Enable individual categories independently
- Set target accuracy with tolerance range
- Choose presets or customize each parameter
- Use seed for reproducible sessions

## Architecture

```
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── popup.html                 # Toolbar popup UI
├── sidepanel.html             # Side panel UI
├── src/
│   ├── background.ts          # Service worker (engine lifecycle)
│   ├── content.ts             # Content script (board interaction)
│   ├── popup.ts               # Popup logic
│   ├── sidepanel.ts           # Side panel logic
│   ├── types.ts               # TypeScript type definitions
│   └── services/
│       ├── EngineManager.ts   # Stockfish WASM communication
│       ├── BoardAdapter.ts    # chess.com DOM interface
│       ├── MoveSelector.ts    # Candidate move selection
│       ├── StrengthController.ts  # Elo-based strength
│       ├── TimingController.ts    # Move timing logic
│       ├── HangingPieceDetector.ts # Vulnerability detection
│       ├── OpponentStatsService.ts # Chess.com API integration
│       ├── OpeningBookService.ts   # Opening book lookup
│       ├── RandomizationEngine.ts  # Human-like play system
│       ├── AutoGameController.ts   # Auto next-game logic
│       └── SettingsStore.ts        # Persistent settings
├── engine/                    # Stockfish WASM files (user-provided)
├── styles/
│   └── content.css            # Overlay styles
└── icons/                     # Extension icons
```

## Troubleshooting

### Engine Not Loading
- Ensure Stockfish WASM files are in `extension/engine/`
- Check the console for WebAssembly errors
- Verify your browser supports WASM (all modern browsers do)
- Try reloading the extension in `chrome://extensions/`

### Board Not Detected
- The extension supports chess.com's current board structure
- If chess.com updates their DOM, the adapter may need updating
- Check the console for `[BoardAdapter]` messages

### Opponent Stats Not Loading
- Chess.com's API may rate-limit requests
- Stats are cached for 5 minutes
- Private profiles may not expose all data
- Check the console for network errors

### Moves Not Executing
- Auto-play requires the board to be in a supported state
- Ensure it's your turn to move
- Check that the extension has `activeTab` permission
- Some game modes may not support automated interaction

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

# Run with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

## Third-Party Assets & Licenses

- **Stockfish** — GPL-3.0 license. The world's strongest open-source chess engine.
- **chess.js** — BSD-2-Clause license. Chess move generation and validation.
- **Chess.com Public API** — Used for opponent statistics. See [Chess.com API docs](https://www.chess.com/news/view/published-data-api).

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
