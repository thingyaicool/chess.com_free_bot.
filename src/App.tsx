import { useState } from 'react'

type Tab = 'overview' | 'features' | 'architecture' | 'setup' | 'demo'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-[#0f0f1a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-xl shadow-lg shadow-emerald-900/30">♟</div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Chess Training Assistant</h1>
              <p className="text-xs text-gray-500">Chrome Extension • Stockfish Powered</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">v1.0.0</span>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700">Manifest V3</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800/40 bg-[#12121f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {([
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'features', label: 'Features', icon: '✨' },
              { id: 'architecture', label: 'Architecture', icon: '🏗️' },
              { id: 'setup', label: 'Setup Guide', icon: '🔧' },
              { id: 'demo', label: 'Interactive Demo', icon: '🎮' },
            ] as { id: Tab; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'features' && <FeaturesTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'setup' && <SetupTab />}
        {activeTab === 'demo' && <DemoTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/40 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>Chess Training Assistant — For educational purposes. Respect platform Terms of Service.</p>
          <p className="mt-1">Stockfish GPL-3.0 • chess.js BSD-2-Clause • Extension MIT</p>
        </div>
      </footer>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 via-[#1a1a2e] to-green-900/20 border border-emerald-800/30 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Complete Chess Analysis Extension
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mb-6">
            A fully-featured Chrome extension with Stockfish engine integration, evaluation bar,
            automatic move selection, Elo-based strength control, hanging piece detection,
            opponent statistics, and an advanced randomization system for human-like play.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge color="emerald">Stockfish WASM</Badge>
            <Badge color="blue">Manifest V3</Badge>
            <Badge color="purple">TypeScript</Badge>
            <Badge color="amber">Web Workers</Badge>
            <Badge color="rose">chess.js</Badge>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value="13" label="Core Features" />
        <StatCard value="11" label="Service Modules" />
        <StatCard value="100%" label="Client-Side" />
        <StatCard value="0" label="API Keys Needed" />
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon="📊" title="Evaluation Bar" desc="Real-time centipawn display with mate indicators and visual bar" />
        <FeatureCard icon="🎯" title="Auto Move Selection" desc="Top N candidates with deterministic or weighted selection" />
        <FeatureCard icon="📈" title="Elo-Based Strength" desc="Play from 400 to 3000+ using UCI_LimitStrength" />
        <FeatureCard icon="🔍" title="Hanging Pieces" desc="Detects vulnerable pieces with tactical awareness" />
        <FeatureCard icon="👤" title="Opponent Stats" desc="Chess.com API integration with caching" />
        <FeatureCard icon="🤖" title="Auto Play" desc="Start/Pause/Stop with side selection" />
        <FeatureCard icon="🔄" title="Auto Next Game" desc="Automatic game progression with limits" />
        <FeatureCard icon="⏱️" title="Move Timing" desc="Configurable min/max with natural pacing" />
        <FeatureCard icon="🎲" title="Randomization" desc="Accuracy targeting with session-adaptive selection" />
        <FeatureCard icon="📖" title="Opening Book" desc="Built-in book with alternatives and names" />
        <FeatureCard icon="🧠" title="Stockfish Engine" desc="Local WASM in Web Worker, no API needed" />
        <FeatureCard icon="⚙️" title="Full Settings" desc="Persistent config with reset-to-defaults" />
      </div>

      {/* Warning */}
      <div className="bg-amber-900/15 border border-amber-700/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-300 mb-1">Important Disclaimer</h3>
            <p className="text-amber-200/70 text-sm">
              Using engine assistance during games on chess.com violates their Terms of Service
              and will result in account bans. This extension is designed for <strong>educational purposes</strong>,
              post-game analysis, and training against computer opponents. The authors are not responsible
              for misuse of this software.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturesTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Detailed Feature Documentation</h2>

      {/* Eval Bar */}
      <FeatureSection
        title="Evaluation Bar"
        icon="📊"
        description="Real-time position evaluation displayed as a visual bar alongside the board."
        details={[
          'Centipawn display: +0.65, -1.20, etc.',
          'Mate indicators: M5, M3, -M2, etc.',
          'Smooth animated transitions',
          'Sigmoid mapping from centipawns to visual percentage',
          'Configurable orientation (vertical/horizontal)',
          'Does not obstruct the chessboard',
        ]}
      />

      {/* Auto Move */}
      <FeatureSection
        title="Automatic Move Selection"
        icon="🎯"
        description="Configurable system for selecting moves from Stockfish's top candidates."
        details={[
          'Top N: Select from 1 to 20 candidate moves',
          'Deterministic: Always picks the highest-ranked move',
          'Weighted: Probabilistic selection favoring stronger moves',
          'Illegal move filtering via chess.js validation',
          'Duplicate prevention between consecutive moves',
          'Handles promotions, castling, en passant correctly',
          'Shows both best move and selected move with ranks',
        ]}
      />

      {/* Elo */}
      <FeatureSection
        title="Play Strength (Elo-Based)"
        icon="📈"
        description="Control engine playing strength using Stockfish's built-in Elo limiter."
        details={[
          'Range: 400 to 3000+ Elo with presets',
          'Uses UCI_LimitStrength + UCI_Elo options',
          'Depth adjusted per level (2-20)',
          'Move time adjusted per level (100ms-3000ms)',
          'Combines with candidate-move selection',
          'Maximum strength mode removes all limits',
          'Note: Stockfish Elo ≠ human Elo exactly',
        ]}
      />

      {/* Hanging Pieces */}
      <FeatureSection
        title="Hanging Piece Detection"
        icon="🔍"
        description="Identifies vulnerable pieces using attack maps and material analysis."
        details={[
          'Detects pieces attacked but insufficiently defended',
          'Distinguishes truly hanging vs. tactically defended',
          'Threat levels: low, medium, high, critical',
          'Color-coded highlights on the board',
          'Click markers for detailed explanations',
          'Shows attackers, defenders, material at risk',
          'Uses chess.js for legal move/attack validation',
        ]}
      />

      {/* Randomization */}
      <FeatureSection
        title="Advanced Randomization System"
        icon="🎲"
        description="Sophisticated system for producing human-like, varied play."
        details={[
          '5 independent categories: Opening, Timing, Delay, Moves, Accuracy',
          'Accuracy targeting: Set target (e.g., 80%) with ±tolerance',
          'Session-adaptive: Varies quality to approach target over time',
          'Seeded PRNG (Mulberry32) for reproducible testing',
          'Presets: Consistent, Balanced, Variable, Custom',
          'Session dashboard: accuracy, distribution, trends',
          'Position complexity affects variation amount',
          'Game phase awareness (opening/middlegame/endgame)',
        ]}
      />

      {/* Opponent Stats */}
      <FeatureSection
        title="Opponent Statistics"
        icon="👤"
        description="Fetches and displays opponent data from Chess.com's public API."
        details={[
          'Username, title, avatar',
          'Ratings: bullet, blitz, rapid, daily',
          'Win/loss/draw records',
          'Total games and best rating',
          '5-minute cache to avoid rate limits',
          'Manual refresh button',
          'Graceful error handling for private profiles',
          'Last-updated timestamp display',
        ]}
      />
    </div>
  )
}

function ArchitectureTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Technical Architecture</h2>

      {/* Architecture Diagram */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">System Architecture</h3>
        <div className="space-y-4">
          <ArchLayer label="Chrome Extension Shell" color="yellow" items={['manifest.json (V3)', 'Permissions: storage, activeTab, sidePanel']} />
          <Arrow />
          <div className="grid md:grid-cols-2 gap-4">
            <ArchLayer label="Background Service Worker" color="green" items={['Engine lifecycle management', 'Message routing', 'Settings persistence']} />
            <ArchLayer label="Content Script" color="blue" items={['Board DOM interaction', 'Overlay rendering', 'Position tracking']} />
          </div>
          <Arrow />
          <div className="grid md:grid-cols-3 gap-4">
            <ArchLayer label="Engine Manager" color="purple" items={['Stockfish WASM', 'UCI protocol', 'Web Worker']} />
            <ArchLayer label="Services Layer" color="emerald" items={['BoardAdapter', 'MoveSelector', 'TimingController']} />
            <ArchLayer label="Analysis Services" color="rose" items={['HangingPieceDetector', 'OpeningBook', 'OpponentStats']} />
          </div>
          <Arrow />
          <ArchLayer label="Data Layer" color="gray" items={['Chrome Storage API', 'In-memory cache', 'Chess.com Public API']} />
        </div>
      </div>

      {/* File Structure */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Project Structure</h3>
        <pre className="bg-[#0f0f1a] rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto leading-relaxed">
{`chess-training-assistant/
├── extension/
│   ├── manifest.json              # Chrome Extension Manifest V3
│   ├── popup.html                 # Toolbar popup UI
│   ├── sidepanel.html             # Side panel UI
│   ├── src/
│   │   ├── background.ts          # Service worker
│   │   ├── content.ts             # Content script
│   │   ├── popup.ts               # Popup logic
│   │   ├── sidepanel.ts           # Side panel logic
│   │   ├── types.ts               # TypeScript definitions
│   │   └── services/
│   │       ├── EngineManager.ts       # Stockfish WASM wrapper
│   │       ├── BoardAdapter.ts        # chess.com DOM interface
│   │       ├── MoveSelector.ts        # Candidate selection
│   │       ├── StrengthController.ts  # Elo management
│   │       ├── TimingController.ts    # Move timing
│   │       ├── HangingPieceDetector.ts # Vulnerability detection
│   │       ├── OpponentStatsService.ts # Chess.com API
│   │       ├── OpeningBookService.ts   # Opening book
│   │       ├── RandomizationEngine.ts  # Human-like play
│   │       ├── AutoGameController.ts   # Auto next-game
│   │       └── SettingsStore.ts        # Persistent settings
│   ├── engine/                    # Stockfish WASM (user-provided)
│   ├── styles/
│   │   └── content.css            # Overlay styles
│   └── icons/                     # Extension icons
├── src/                           # React documentation site
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.js`}
        </pre>
      </div>

      {/* Data Flow */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Data Flow</h3>
        <div className="space-y-3">
          {[
            'Content script observes chess.com board via MutationObserver',
            'Position change detected → FEN extracted from DOM',
            'FEN sent to background service worker via chrome.runtime',
            'Background passes FEN to Stockfish Web Worker',
            'Stockfish analyzes and returns best move + evaluation',
            'Result broadcast to content script and side panel',
            'Content script updates eval bar and board overlays',
            'If auto-play enabled: move selected, timed, and executed',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-gray-300">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module Descriptions */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Module Responsibilities</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'EngineManager', desc: 'Stockfish WASM lifecycle, UCI communication, analysis control' },
            { name: 'BoardAdapter', desc: 'DOM reading, FEN extraction, move execution via click simulation' },
            { name: 'MoveSelector', desc: 'Candidate ranking, deterministic/weighted selection, accuracy targeting' },
            { name: 'StrengthController', desc: 'Elo presets, depth/time mapping, UCI_LimitStrength config' },
            { name: 'TimingController', desc: 'Min/max delays, variation, complexity adjustment, scheduling' },
            { name: 'HangingPieceDetector', desc: 'Attack maps, material analysis, tactical defense detection' },
            { name: 'OpponentStatsService', desc: 'Chess.com API, caching, error handling, rate limiting' },
            { name: 'OpeningBookService', desc: 'FEN lookup, move alternatives, opening name identification' },
            { name: 'RandomizationEngine', desc: 'Multi-category randomization, seeded PRNG, session tracking' },
            { name: 'AutoGameController', desc: 'Game progression, session limits, delay scheduling' },
            { name: 'SettingsStore', desc: 'Chrome Storage API, defaults merging, change subscriptions' },
          ].map(mod => (
            <div key={mod.name} className="bg-[#0f0f1a] rounded-lg p-3 border border-gray-800/50">
              <p className="font-mono text-sm font-bold text-emerald-400">{mod.name}</p>
              <p className="text-xs text-gray-400 mt-1">{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SetupTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Setup & Installation Guide</h2>

      <StepBlock
        step={1}
        title="Clone the Repository"
        code={`git clone https://github.com/yourusername/chess-training-assistant.git
cd chess-training-assistant`}
      />

      <StepBlock
        step={2}
        title="Install Dependencies"
        code={`npm install`}
      />

      <StepBlock
        step={3}
        title="Download Stockfish WASM"
        code={`# Option A: From npm
npm install stockfish
mkdir -p extension/engine
cp node_modules/stockfish/src/engine/* extension/engine/

# Option B: Manual download from CDN
# https://cdn.jsdelivr.net/npm/stockfish/src/engine/
# Download: stockfish.js, stockfish.wasm, stockfish.worker.js`}
        note="Stockfish WASM files are ~15MB and must be placed in extension/engine/"
      />

      <StepBlock
        step={4}
        title="Build the Extension"
        code={`# Build extension TypeScript
cd extension
npx tsc --project tsconfig.json

# Or use the project build script
npm run build:extension`}
      />

      <StepBlock
        step={5}
        title="Load in Chrome"
        description="Load the unpacked extension in Chrome:"
        items={[
          'Open chrome://extensions/',
          'Enable Developer mode (toggle in top-right)',
          'Click "Load unpacked"',
          'Select the extension/ directory',
          'The extension icon appears in your toolbar',
        ]}
      />

      <StepBlock
        step={6}
        title="Configure & Use"
        description="Once loaded:"
        items={[
          'Click the extension icon to open the popup',
          'Open the side panel for detailed analysis',
          'Navigate to chess.com and start a game',
          'The eval bar and overlays appear automatically',
          'Configure strength, timing, and randomization in the popup',
        ]}
      />

      {/* Troubleshooting */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">🔧 Troubleshooting</h3>
        <div className="space-y-4">
          <TroubleshootItem
            issue="Engine not loading"
            solutions={[
              'Verify stockfish.js, stockfish.wasm, stockfish.worker.js are in extension/engine/',
              'Check browser console for WebAssembly errors',
              'Ensure Content Security Policy allows wasm-unsafe-eval',
              'Reload the extension in chrome://extensions/',
            ]}
          />
          <TroubleshootItem
            issue="Board not detected"
            solutions={[
              'Ensure you are on a chess.com game page',
              'Check console for [BoardAdapter] messages',
              'The DOM structure may have changed — update selectors in BoardAdapter.ts',
            ]}
          />
          <TroubleshootItem
            issue="Opponent stats not loading"
            solutions={[
              'Chess.com API may rate-limit — wait 5 minutes',
              'Private profiles may not expose all data',
              'Check network tab for failed requests',
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function DemoTab() {
  const [evalValue, setEvalValue] = useState(0.35)
  const [elo, setElo] = useState(1600)
  const [topN, setTopN] = useState(3)
  const [autoPlay, setAutoPlay] = useState(false)
  const [minTime, setMinTime] = useState(1.0)
  const [maxTime, setMaxTime] = useState(6.0)
  const [accuracyTarget, setAccuracyTarget] = useState(80)
  const [randomEnabled, setRandomEnabled] = useState(true)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Interactive Configuration Demo</h2>
      <p className="text-gray-400">Configure the extension settings below. This is a live preview of the popup interface.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Eval Bar Preview */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">Evaluation Bar</h3>
            <div className="flex items-center gap-4">
              <div className="w-8 h-48 bg-gray-800 rounded overflow-hidden flex flex-col-reverse relative">
                <div
                  className="bg-gray-200 transition-all duration-300 w-full"
                  style={{ height: `${50 + (evalValue * 50)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600 mix-blend-difference">
                    {evalValue >= 0 ? '+' : ''}{evalValue.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.05"
                  value={evalValue}
                  onChange={e => setEvalValue(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Drag to simulate evaluation changes</p>
              </div>
            </div>
          </div>

          {/* Play Strength */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">Play Strength</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Target Elo</span>
                <select
                  value={elo}
                  onChange={e => setElo(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value={400}>400 — Very Beginner</option>
                  <option value={800}>800 — Novice</option>
                  <option value={1000}>1000 — Beginner</option>
                  <option value={1200}>1200 — Casual</option>
                  <option value={1400}>1400 — Intermediate</option>
                  <option value={1600}>1600 — Club ★</option>
                  <option value={1800}>1800 — Strong Club</option>
                  <option value={2000}>2000 — Advanced</option>
                  <option value={2200}>2200 — Expert</option>
                  <option value={2500}>2500 — GM</option>
                  <option value={3000}>Maximum</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Candidates (Top N)</span>
                <select
                  value={topN}
                  onChange={e => setTopN(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value={1}>Top 1 (Best)</option>
                  <option value={2}>Top 2</option>
                  <option value={3}>Top 3 ★</option>
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">Move Timing</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Min Time</span>
                <input
                  type="number"
                  value={minTime}
                  min={0.1}
                  max={30}
                  step={0.1}
                  onChange={e => setMinTime(parseFloat(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-20 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Max Time</span>
                <input
                  type="number"
                  value={maxTime}
                  min={0.5}
                  max={60}
                  step={0.1}
                  onChange={e => setMaxTime(parseFloat(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-20 text-right"
                />
              </div>
              <div className="bg-gray-800/50 rounded p-2 text-xs text-gray-400">
                Effective range: {minTime.toFixed(1)}s — {maxTime.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Randomization */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">Randomization</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Enable</span>
                <button
                  onClick={() => setRandomEnabled(!randomEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors ${randomEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${randomEnabled ? 'translate-x-5' : ''}`}></div>
                </button>
              </div>
              {randomEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Target Accuracy</span>
                    <input
                      type="number"
                      value={accuracyTarget}
                      min={30}
                      max={100}
                      onChange={e => setAccuracyTarget(parseInt(e.target.value))}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-20 text-right"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {['Opening', 'Timing', 'Delay', 'Moves', 'Accuracy'].map(cat => (
                      <div key={cat} className="bg-emerald-900/30 border border-emerald-800/40 rounded px-1 py-1.5 text-center text-xs text-emerald-400">
                        {cat}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5 sticky top-24">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">Live Configuration Preview</h3>
            <div className="space-y-3">
              <PreviewRow label="Engine" value="Stockfish WASM (Local)" />
              <PreviewRow label="Strength" value={`${elo} Elo`} />
              <PreviewRow label="Candidates" value={`Top ${topN}`} />
              <PreviewRow label="Selection" value="Weighted" />
              <PreviewRow label="Timing" value={`${minTime.toFixed(1)}s — ${maxTime.toFixed(1)}s`} />
              <PreviewRow label="Randomization" value={randomEnabled ? `Enabled (${accuracyTarget}%)` : 'Disabled'} />
              <PreviewRow label="Auto Play" value={autoPlay ? 'Active' : 'Inactive'} />
              <PreviewRow label="Eval" value={`${evalValue >= 0 ? '+' : ''}${evalValue.toFixed(2)}`} />

              <div className="mt-4 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                    autoPlay
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {autoPlay ? '⏹ Stop Auto Play' : '▶ Start Auto Play'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Active Configuration (JSON):</p>
                <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{JSON.stringify({
  engine: { elo: elo >= 3000 ? null : elo, depth: elo >= 2500 ? 18 : elo >= 2000 ? 14 : elo >= 1600 ? 10 : 6 },
  candidates: { topN, mode: 'weighted' },
  timing: { min: minTime, max: maxTime },
  randomization: { enabled: randomEnabled, accuracy: accuracyTarget },
}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Reusable Components ---

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40',
    blue: 'bg-blue-900/40 text-blue-400 border-blue-800/40',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-800/40',
    amber: 'bg-amber-900/40 text-amber-400 border-amber-800/40',
    rose: 'bg-rose-900/40 text-rose-400 border-rose-800/40',
  }
  return (
    <span className={`px-2.5 py-1 text-xs rounded-full border ${colors[color] || colors.emerald}`}>
      {children}
    </span>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 hover:border-emerald-800/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  )
}

function FeatureSection({ title, icon, description, details }: { title: string; icon: string; description: string; details: string[] }) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <ul className="space-y-1.5">
        {details.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-emerald-500 mt-0.5">•</span>
            {d}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArchLayer({ label, color, items }: { label: string; color: string; items: string[] }) {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-700/40 bg-yellow-900/10',
    green: 'border-emerald-700/40 bg-emerald-900/10',
    blue: 'border-blue-700/40 bg-blue-900/10',
    purple: 'border-purple-700/40 bg-purple-900/10',
    emerald: 'border-emerald-700/40 bg-emerald-900/10',
    rose: 'border-rose-700/40 bg-rose-900/10',
    gray: 'border-gray-700/40 bg-gray-800/20',
  }
  const labelColors: Record<string, string> = {
    yellow: 'text-yellow-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    gray: 'text-gray-400',
  }
  return (
    <div className={`border ${colors[color]} rounded-lg p-4`}>
      <p className={`font-bold text-sm ${labelColors[color]} mb-2`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="text-xs bg-gray-800/60 px-2 py-1 rounded text-gray-300">{item}</span>
        ))}
      </div>
    </div>
  )
}

function Arrow() {
  return <div className="flex justify-center text-gray-600 text-xl">↓</div>
}

function StepBlock({ step, title, code, description, items, note }: { step: number; title: string; code?: string; description?: string; items?: string[]; note?: string }) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">{step}</div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {description && <p className="text-sm text-gray-400 mb-3">{description}</p>}
      {code && (
        <pre className="bg-[#0f0f1a] rounded-lg p-4 font-mono text-sm text-emerald-300 overflow-x-auto mb-3">
          <code>{code}</code>
        </pre>
      )}
      {items && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-emerald-500 mt-0.5">•</span>{item}
            </li>
          ))}
        </ul>
      )}
      {note && (
        <p className="mt-3 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded p-2">ℹ️ {note}</p>
      )}
    </div>
  )
}

function TroubleshootItem({ issue, solutions }: { issue: string; solutions: string[] }) {
  return (
    <div className="border-l-2 border-amber-600 pl-4">
      <p className="font-medium text-amber-300 text-sm">{issue}</p>
      <ul className="mt-1 space-y-0.5">
        {solutions.map((s, i) => (
          <li key={i} className="text-xs text-gray-400">→ {s}</li>
        ))}
      </ul>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

export default App
