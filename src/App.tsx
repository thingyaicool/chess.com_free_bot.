import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'stockfish' | 'architecture' | 'code'>('overview')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="text-3xl">♟️</div>
          <div>
            <h1 className="text-xl font-bold text-white">Chess.com Extension Guide</h1>
            <p className="text-sm text-gray-400">Building a Chrome extension with Stockfish</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-800/40 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl">🔑</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-300 mb-2">
                Do you need an API for Stockfish?
              </h2>
              <p className="text-xl text-green-200/80 font-medium">
                No! Stockfish runs entirely in the browser via WebAssembly.
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
            Stockfish is compiled to <code className="bg-gray-800 px-2 py-0.5 rounded text-green-300">.wasm</code> and runs 
            in a Web Worker — no server, no API key, no external service. It's 100% client-side 
            and free to use.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex gap-1 mb-8 bg-gray-900 rounded-xl p-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📋' },
            { id: 'stockfish', label: 'Stockfish Setup', icon: '🧠' },
            { id: 'architecture', label: 'Architecture', icon: '🏗️' },
            { id: 'code', label: 'Code Examples', icon: '💻' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'stockfish' && <StockfishTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'code' && <CodeTab />}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>For educational purposes. Respect chess.com's Terms of Service.</p>
        </div>
      </footer>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard
          emoji="✅"
          title="What you DON'T need"
          items={[
            'No API key or account',
            'No server or backend',
            'No paid service subscription',
            'No external network requests for analysis',
          ]}
          color="green"
        />
        <InfoCard
          emoji="📦"
          title="What you DO need"
          items={[
            'Stockfish WASM file (~15MB)',
            'A Web Worker to run it',
            'Content scripts for chess.com DOM',
            'Chrome Extension Manifest (v3)',
          ]}
          color="blue"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Facts
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Fact label="Stockfish Engine" value="~15 MB WASM" />
          <Fact label="Runs in" value="Web Worker" />
          <Fact label="Communication" value="UCI Protocol" />
          <Fact label="API Required?" value="No!" />
          <Fact label="Cost" value="Free (GPL)" />
          <Fact label="Offline?" value="Yes, fully" />
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-300 mb-2 flex items-center gap-2">
          <span>⚠️</span> Important Note
        </h3>
        <p className="text-yellow-200/80">
          Using engine assistance on chess.com violates their Terms of Service and can result in a permanent ban. 
          This guide is for <strong>educational purposes only</strong> — to learn about Chrome extensions, 
          WebAssembly, and chess engine integration.
        </p>
      </div>
    </div>
  )
}

function StockfishTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">🧠 How Stockfish Works in the Browser</h3>
        <div className="space-y-4 text-gray-300">
          <p>
            Stockfish is a C++ chess engine. Using Emscripten, it gets compiled to WebAssembly (.wasm), 
            which runs at near-native speed in the browser.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-green-300">
            <p className="text-gray-500">// The flow:</p>
            <p>1. Load stockfish.wasm in a Web Worker</p>
            <p>2. Send UCI commands via postMessage()</p>
            <p>3. Receive analysis via postMessage()</p>
            <p>4. Parse the output (best move, eval, PV)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📥 Where to Get Stockfish WASM</h3>
        <div className="space-y-4">
          <Option
            number={1}
            title="npm package (easiest)"
            description="Use the 'stockfish' or 'stockfish.js' npm package"
            code="npm install stockfish"
          />
          <Option
            number={2}
            title="GitHub releases"
            description="Download pre-built WASM from stockfish.js GitHub repos"
            code="https://github.com/lichess-org/stockfish.wasm"
          />
          <Option
            number={3}
            title="Build from source"
            description="Compile Stockfish C++ to WASM using Emscripten"
            code="emcc -o stockfish.js stockfish.cpp ..."
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">🔌 UCI Protocol Basics</h3>
        <p className="text-gray-400 mb-4">Stockfish communicates using the UCI (Universal Chess Interface) protocol:</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-bold text-blue-400 mb-2">→ Commands you send:</p>
            <div className="font-mono text-sm space-y-1 text-gray-300">
              <p><span className="text-green-400">uci</span></p>
              <p><span className="text-green-400">isready</span></p>
              <p><span className="text-green-400">position fen</span> [fen_string]</p>
              <p><span className="text-green-400">go depth</span> [n]</p>
              <p><span className="text-green-400">go movetime</span> [ms]</p>
              <p><span className="text-green-400">stop</span></p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-bold text-purple-400 mb-2">← Responses you get:</p>
            <div className="font-mono text-sm space-y-1 text-gray-300">
              <p><span className="text-yellow-400">uciok</span></p>
              <p><span className="text-yellow-400">readyok</span></p>
              <p><span className="text-yellow-400">info depth</span> ... score cp 35</p>
              <p><span className="text-yellow-400">info</span> ... pv e2e4 e7e5</p>
              <p><span className="text-yellow-400">bestmove</span> e2e4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArchitectureTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">🏗️ Extension Architecture</h3>
        <div className="relative">
          {/* Architecture diagram */}
          <div className="space-y-4">
            <ArchBlock
              label="manifest.json"
              description="Extension config — permissions, content scripts, background"
              color="yellow"
            />
            <Arrow />
            <div className="grid md:grid-cols-2 gap-4">
              <ArchBlock
                label="Content Script"
                description="Injected into chess.com pages. Reads board state from DOM, draws arrows/overlays."
                color="blue"
              />
              <ArchBlock
                label="Background Service Worker"
                description="Runs Stockfish in a Web Worker. Receives FEN from content script, returns analysis."
                color="green"
              />
            </div>
            <Arrow />
            <ArchBlock
              label="Stockfish Web Worker (WASM)"
              description="The actual engine. Runs UCI commands and returns best moves + evaluations."
              color="purple"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📁 File Structure</h3>
        <pre className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
{`my-chess-extension/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker (runs Stockfish)
├── content.js             # Injected into chess.com
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── styles.css             # Overlay styles
├── engine/
│   ├── stockfish.js       # Stockfish WASM loader
│   ├── stockfish.wasm     # The engine binary
│   └── stockfish.worker.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png`}
        </pre>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">🔄 Data Flow</h3>
        <div className="space-y-3">
          <FlowStep step={1} text="Content script reads the board position from chess.com's DOM" />
          <FlowStep step={2} text="Converts DOM state to FEN notation" />
          <FlowStep step={3} text="Sends FEN to background script via chrome.runtime.sendMessage()" />
          <FlowStep step={4} text="Background script passes FEN to Stockfish Web Worker" />
          <FlowStep step={5} text="Stockfish analyzes and returns best move + eval" />
          <FlowStep step={6} text="Content script displays the result as an overlay/arrow" />
        </div>
      </div>
    </div>
  )
}

function CodeTab() {
  return (
    <div className="space-y-8">
      <CodeBlock
        title="manifest.json"
        description="Extension manifest with required permissions"
        code={`{
  "manifest_version": 3,
  "name": "Chess Analysis Helper",
  "version": "1.0",
  "description": "Chess engine analysis tool",
  "permissions": ["activeTab"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["https://www.chess.com/*"],
    "js": ["content.js"],
    "css": ["styles.css"]
  }],
  "web_accessible_resources": [{
    "resources": ["engine/*"],
    "matches": ["https://www.chess.com/*"]
  }]
}`}
      />

      <CodeBlock
        title="background.js"
        description="Service worker that runs Stockfish in a Web Worker"
        code={`// Initialize Stockfish worker
let stockfishWorker = null;

function initEngine() {
  stockfishWorker = new Worker('engine/stockfish.js');
  
  stockfishWorker.onmessage = (e) => {
    const line = e.data;
    
    if (line.startsWith('bestmove')) {
      const move = line.split(' ')[1];
      // Send result back to content script
      chrome.runtime.sendMessage({
        type: 'ENGINE_RESULT',
        move: move,
        fullLine: line
      });
    }
  };
  
  // Initialize UCI
  stockfishWorker.postMessage('uci');
  stockfishWorker.postMessage('isready');
}

// Listen for analysis requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ANALYZE') {
    if (!stockfishWorker) initEngine();
    
    stockfishWorker.postMessage(\`position fen \${msg.fen}\`);
    stockfishWorker.postMessage('go depth 15');
    sendResponse({ status: 'analyzing' });
  }
});`}
      />

      <CodeBlock
        title="content.js"
        description="Content script that reads the board and sends for analysis"
        code={`// Observe the chess board for changes
function getBoardFEN() {
  // Read position from chess.com's DOM
  // This depends on chess.com's current structure
  const board = document.querySelector('.board');
  // ... extract piece positions from DOM ...
  return fenString;
}

// Watch for position changes
const observer = new MutationObserver(() => {
  const fen = getBoardFEN();
  if (fen) {
    chrome.runtime.sendMessage({
      type: 'ANALYZE',
      fen: fen
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for engine results
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ENGINE_RESULT') {
    displayAnalysis(msg.move, msg.fullLine);
  }
});

function displayAnalysis(move, info) {
  // Draw arrow on the board, show eval bar, etc.
  console.log('Best move:', move);
}`}
      />

      <CodeBlock
        title="Reading the Board (Alternative)"
        description="Using chess.com's internal state (if accessible)"
        code={`// Method 1: Parse from DOM (pieces as class names)
function getFENFromDOM() {
  const squares = document.querySelectorAll('[class*="square"]');
  let fen = '';
  // ... parse square classes to build FEN ...
  return fen;
}

// Method 2: Intercept WebSocket messages
// chess.com sends position data over WebSocket
// You can intercept these for accurate FEN

// Method 3: Use the chess.js library to validate
// import { Chess } from 'chess.js';
// const game = new Chess(fen);
// game.move('e2e4'); // validate moves`}
      />

      <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-300 mb-2 flex items-center gap-2">
          <span>💡</span> Pro Tips
        </h3>
        <ul className="space-y-2 text-blue-200/80">
          <li>• Use <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300">chess.js</code> npm package for FEN validation and move generation</li>
          <li>• Limit depth to 12-15 for fast responses (sub-second)</li>
          <li>• Use <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300">go movetime 500</code> instead of depth for consistent timing</li>
          <li>• Stockfish WASM supports MultiPV for showing multiple lines</li>
          <li>• Cache positions you've already analyzed to save computation</li>
        </ul>
      </div>
    </div>
  )
}

// --- Reusable Components ---

function InfoCard({ emoji, title, items, color }: { emoji: string; title: string; items: string[]; color: string }) {
  const borderColor = color === 'green' ? 'border-green-800/40' : 'border-blue-800/40'
  const titleColor = color === 'green' ? 'text-green-300' : 'text-blue-300'
  
  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-xl p-6`}>
      <h3 className={`text-lg font-bold ${titleColor} mb-4 flex items-center gap-2`}>
        <span className="text-2xl">{emoji}</span> {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-gray-300">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
    </div>
  )
}

function Option({ number, title, description, code }: { number: number; title: string; description: string; code: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-gray-400 mb-2">{description}</p>
        <code className="text-xs bg-gray-800 px-2 py-1 rounded text-green-300 block">{code}</code>
      </div>
    </div>
  )
}

function ArchBlock({ label, description, color }: { label: string; description: string; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-600/50 bg-yellow-900/20',
    blue: 'border-blue-600/50 bg-blue-900/20',
    green: 'border-green-600/50 bg-green-900/20',
    purple: 'border-purple-600/50 bg-purple-900/20',
  }
  const labelColors: Record<string, string> = {
    yellow: 'text-yellow-300',
    blue: 'text-blue-300',
    green: 'text-green-300',
    purple: 'text-purple-300',
  }
  return (
    <div className={`border ${colors[color]} rounded-lg p-4`}>
      <p className={`font-bold ${labelColors[color]}`}>{label}</p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <div className="text-gray-600 text-2xl">↓</div>
    </div>
  )
}

function FlowStep({ step, text }: { step: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
        {step}
      </div>
      <p className="text-sm text-gray-300">{text}</p>
    </div>
  )
}

function CodeBlock({ title, description, code }: { title: string; description: string; code: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h4 className="font-bold text-white text-sm">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default App
