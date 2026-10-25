import { useState } from 'react'

type Tab = 'overview' | 'features' | 'setup' | 'demo'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#3fb950] to-[#238636] flex items-center justify-center text-sm">♞</div>
            <div>
              <h1 className="text-sm font-semibold text-[#e6edf3]">Chess Training Assistant</h1>
              <p className="text-[10px] text-[#6e7681]">Chrome Extension • Stockfish Powered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">v1.0.0</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#21262d] text-[#9198a1] border border-[#30363d]">MV3</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-[#30363d] bg-[#161b22]/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 py-1.5 overflow-x-auto">
            {([
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'features', label: 'Features', icon: '✨' },
              { id: 'setup', label: 'Setup', icon: '🔧' },
              { id: 'demo', label: 'Config Demo', icon: '🎮' },
            ] as { id: Tab; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30'
                    : 'text-[#9198a1] hover:text-[#e6edf3] hover:bg-[#21262d]'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'features' && <FeaturesTab />}
        {activeTab === 'setup' && <SetupTab />}
        {activeTab === 'demo' && <DemoTab />}
      </main>

      <footer className="border-t border-[#30363d] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-[#6e7681] text-xs">
          <p>Chess Training Assistant — For educational purposes. Respect platform Terms of Service.</p>
          <p className="mt-1">Stockfish GPL-3.0 • chess.js BSD-2-Clause • Extension MIT</p>
        </div>
      </footer>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-[#238636]/10 via-[#161b22] to-[#1c2128] border border-[#238636]/20 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-[#e6edf3] mb-3">Complete Chess Analysis Extension</h2>
        <p className="text-sm text-[#9198a1] max-w-2xl mb-4">
          A fully-featured Chrome extension with Stockfish engine integration, evaluation bar,
          automatic move selection, Elo-based strength control, hanging piece detection,
          opponent statistics, and an advanced randomization system for human-like play.
        </p>
        <div className="flex flex-wrap gap-2">
          {['Stockfish WASM', 'Manifest V3', 'TypeScript', 'Web Workers', 'chess.js', 'Human-Like AI'].map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-[#21262d] text-[#9198a1] border border-[#30363d]">{tag}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: '13', l: 'Core Features' },
          { v: '11', l: 'Service Modules' },
          { v: '100%', l: 'Client-Side' },
          { v: '0', l: 'API Keys Needed' },
        ].map(s => (
          <div key={s.l} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-[#3fb950]">{s.v}</p>
            <p className="text-[10px] text-[#6e7681] mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          { i: '📊', t: 'Evaluation Bar', d: 'Real-time centipawn display with mate indicators' },
          { i: '🎯', t: 'Auto Move Selection', d: 'Top N candidates, weighted selection' },
          { i: '📈', t: 'Elo Strength', d: '400 to 3000+ with recommended presets' },
          { i: '🔍', t: 'Hanging Pieces', d: 'Tactical awareness, threat levels' },
          { i: '👤', t: 'Opponent Stats', d: 'Chess.com API with caching' },
          { i: '🤖', t: 'Auto Play', d: 'Start/Pause/Stop with side selection' },
          { i: '🔄', t: 'Auto Next Game', d: 'Session limits, configurable delay' },
          { i: '⏱️', t: 'Move Timing', d: 'Natural pacing, complexity adjustment' },
          { i: '🎲', t: 'Randomization', d: 'Accuracy targeting, session-adaptive' },
          { i: '📖', t: 'Opening Book', d: 'Built-in book with alternatives' },
          { i: '🧠', t: 'Stockfish Engine', d: 'Local WASM, no API needed' },
          { i: '⚙️', t: 'Full Settings', d: 'Persistent, reset-to-defaults' },
        ].map(f => (
          <div key={f.t} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 hover:border-[#58a6ff]/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span>{f.i}</span>
              <h3 className="text-xs font-semibold text-[#e6edf3]">{f.t}</h3>
            </div>
            <p className="text-[11px] text-[#6e7681]">{f.d}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#d29922]/10 border border-[#d29922]/30 rounded-lg p-4">
        <p className="text-xs text-[#d29922]">
          <strong>⚠️ Important:</strong> Using engine assistance during games on chess.com violates their Terms of Service.
          This extension is for educational purposes, post-game analysis, and training against computer opponents.
        </p>
      </div>
    </div>
  )
}

function FeaturesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#e6edf3]">Feature Documentation</h2>

      {[
        {
          icon: '⏱️', title: 'Think Time & Depth Settings',
          desc: 'Configure how long the engine thinks per move.',
          details: [
            'Think Time: 0.5s to 30s (recommended: 3s)',
            'Depth: 1 to 30 (recommended: 15)',
            'Analysis Mode: Choose Think Time or Fixed Depth',
            'Human-like variation: ±15-30% random timing',
          ],
        },
        {
          icon: '🎲', title: 'Advanced Randomization (Anti-Detection)',
          desc: 'Sophisticated system for producing human-like, varied play.',
          details: [
            '5 independent categories: Opening, Timing, Delay, Moves, Accuracy',
            'Accuracy targeting: Set target (e.g., 75%) with ±tolerance',
            'Session-adaptive: Varies quality to approach target over time',
            'Human-like timing: Random variation in think times',
            'Presets: Casual (60%), Balanced (75%), Strong (85%), Masterful (93%)',
            'Seeded PRNG for reproducible testing',
          ],
        },
        {
          icon: '📈', title: 'Elo-Based Strength (Recommended Presets)',
          desc: 'Control engine playing strength with recommended settings.',
          details: [
            'Range: 400 to 3000+ Elo',
            'Each level has recommended depth, think time, and accuracy',
            'Uses UCI_LimitStrength + UCI_Elo options',
            'Combines with candidate-move selection',
            'Maximum strength mode removes all limits',
          ],
        },
        {
          icon: '🎯', title: 'Automatic Move Selection',
          desc: 'Configurable system for selecting moves from candidates.',
          details: [
            'Top N: Select from 1 to 20 candidate moves',
            'Deterministic: Always picks highest-ranked move',
            'Weighted: Probabilistic selection favoring stronger moves',
            'Illegal move filtering via chess.js',
            'Duplicate prevention',
          ],
        },
      ].map(section => (
        <div key={section.title} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{section.icon}</span>
            <h3 className="text-sm font-bold text-[#e6edf3]">{section.title}</h3>
          </div>
          <p className="text-xs text-[#9198a1] mb-3">{section.desc}</p>
          <ul className="space-y-1">
            {section.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#9198a1]">
                <span className="text-[#3fb950] mt-0.5">•</span>{d}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function SetupTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#e6edf3]">Installation Guide</h2>

      {[
        { step: 1, title: 'Clone & Install', code: 'git clone <repo-url>\ncd chess-training-assistant\nnpm install' },
        { step: 2, title: 'Download Stockfish WASM', code: '# Place in extension/engine/\n# stockfish.js, stockfish.wasm, stockfish.worker.js\n# Get from: npm install stockfish' },
        { step: 3, title: 'Generate Icons', code: 'node scripts/generate-icons.js' },
        { step: 4, title: 'Build Extension', code: 'npm run build:extension' },
        { step: 5, title: 'Load in Chrome', items: ['Open chrome://extensions/', 'Enable Developer mode', 'Click "Load unpacked"', 'Select the extension/ directory'] },
      ].map(s => (
        <div key={s.step} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#238636] flex items-center justify-center text-[10px] font-bold text-white">{s.step}</div>
            <h3 className="text-sm font-bold text-[#e6edf3]">{s.title}</h3>
          </div>
          {s.code && (
            <pre className="bg-[#0d1117] rounded p-3 text-xs text-[#3fb950] font-mono overflow-x-auto mt-2">
              <code>{s.code}</code>
            </pre>
          )}
          {s.items && (
            <ul className="space-y-1 mt-2">
              {s.items.map((item, i) => (
                <li key={i} className="text-xs text-[#9198a1] flex items-center gap-2">
                  <span className="text-[#3fb950]">→</span>{item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#e6edf3] mb-2">Build Commands</h3>
        <div className="space-y-1 font-mono text-xs">
          <p><span className="text-[#58a6ff]">npm run dev</span> <span className="text-[#6e7681]">— Website dev server</span></p>
          <p><span className="text-[#58a6ff]">npm run build</span> <span className="text-[#6e7681]">— Build website</span></p>
          <p><span className="text-[#58a6ff]">npm run build:extension</span> <span className="text-[#6e7681]">— Build Chrome extension</span></p>
          <p><span className="text-[#58a6ff]">npm run typecheck</span> <span className="text-[#6e7681]">— Type-check website</span></p>
          <p><span className="text-[#58a6ff]">npm run typecheck:extension</span> <span className="text-[#6e7681]">— Type-check extension</span></p>
          <p><span className="text-[#58a6ff]">npm test</span> <span className="text-[#6e7681]">— Run unit tests</span></p>
        </div>
      </div>
    </div>
  )
}

function DemoTab() {
  const [evalValue, setEvalValue] = useState(0.35)
  const [elo, setElo] = useState(1600)
  const [thinkTime, setThinkTime] = useState(3)
  const [depth, setDepth] = useState(15)
  const [accuracy, setAccuracy] = useState(75)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#e6edf3]">Interactive Configuration</h2>
      <p className="text-xs text-[#6e7681]">Configure settings and see the live preview.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Eval */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wide mb-3">Evaluation</h3>
            <div className="flex items-center gap-3">
              <div className="w-6 h-32 bg-[#302e2b] rounded overflow-hidden flex flex-col-reverse relative">
                <div className="bg-[#eeeed2] transition-all w-full" style={{ height: `${50 + evalValue * 50}%` }}></div>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[#666] mix-blend-difference">
                  {evalValue >= 0 ? '+' : ''}{evalValue.toFixed(2)}
                </span>
              </div>
              <input type="range" min="-3" max="3" step="0.05" value={evalValue} onChange={e => setEvalValue(parseFloat(e.target.value))} className="flex-1 accent-[#3fb950]" />
            </div>
          </div>

          {/* Engine */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wide mb-3">Engine Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9198a1]">Think Time <span className="text-[#3fb950]">★ 3s</span></span>
                <input type="number" value={thinkTime} min={0.5} max={30} step={0.5} onChange={e => setThinkTime(parseFloat(e.target.value))} className="bg-[#1c2128] border border-[#30363d] rounded px-2 py-1 text-xs text-[#e6edf3] w-16 text-right" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9198a1]">Depth <span className="text-[#3fb950]">★ 15</span></span>
                <input type="number" value={depth} min={1} max={30} onChange={e => setDepth(parseInt(e.target.value))} className="bg-[#1c2128] border border-[#30363d] rounded px-2 py-1 text-xs text-[#e6edf3] w-16 text-right" />
              </div>
            </div>
          </div>

          {/* Elo */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wide mb-3">Play Strength</h3>
            <select value={elo} onChange={e => setElo(parseInt(e.target.value))} className="w-full bg-[#1c2128] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3]">
              <option value={400}>400 — Very Beginner</option>
              <option value={800}>800 — Novice</option>
              <option value={1200}>1200 — Casual</option>
              <option value={1400}>1400 — Intermediate</option>
              <option value={1600}>1600 — Club ★</option>
              <option value={1800}>1800 — Strong Club</option>
              <option value={2000}>2000 — Advanced</option>
              <option value={2500}>2500 — GM</option>
              <option value={3000}>Maximum</option>
            </select>
          </div>

          {/* Accuracy */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wide mb-3">Accuracy Target</h3>
            <div className="flex items-center gap-3">
              <input type="range" min={30} max={100} value={accuracy} onChange={e => setAccuracy(parseInt(e.target.value))} className="flex-1 accent-[#58a6ff]" />
              <span className="text-xs font-mono text-[#e6edf3] w-10 text-right">{accuracy}%</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[{ l: 'Casual', v: 60 }, { l: 'Balanced', v: 75 }, { l: 'Strong', v: 85 }, { l: 'Master', v: 93 }].map(p => (
                <button key={p.l} onClick={() => setAccuracy(p.v)} className={`flex-1 py-1 rounded text-[10px] border transition-all ${accuracy === p.v ? 'bg-[#58a6ff] border-[#58a6ff] text-white' : 'bg-transparent border-[#30363d] text-[#6e7681] hover:border-[#58a6ff]'}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 sticky top-24">
          <h3 className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wide mb-3">Live Configuration</h3>
          <div className="space-y-2">
            {[
              ['Engine', 'Stockfish WASM (Local)'],
              ['Think Time', `${thinkTime}s`],
              ['Depth', `${depth}`],
              ['Elo', `${elo >= 3000 ? 'Maximum' : elo}`],
              ['Accuracy', `${accuracy}%`],
              ['Timing Variation', '±15-30%'],
              ['Move Selection', 'Weighted'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-[#30363d]/50 last:border-0">
                <span className="text-[10px] text-[#6e7681]">{k}</span>
                <span className="text-xs font-medium text-[#e6edf3]">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#0d1117] rounded border border-[#30363d]">
            <p className="text-[10px] text-[#6e7681] mb-1">Config JSON:</p>
            <pre className="text-[10px] text-[#9198a1] font-mono overflow-x-auto">
{JSON.stringify({
  engine: { thinkTime, depth, elo: elo >= 3000 ? null : elo },
  accuracy: { target: accuracy, tolerance: 5 },
  timing: { variation: '15-30%' },
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
