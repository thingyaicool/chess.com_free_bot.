/**
 * Side Panel script - Main analysis workspace.
 * Displays board, analysis, opening, opponent stats, and settings.
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeSidePanel();
  checkEngineStatus();
  startSessionTimer();
});

function initializeSidePanel(): void {
  // Listen for updates from background/content scripts
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'ENGINE_RESULT':
        updateAnalysisPanel(message.payload);
        updateEvalBar(message.payload);
        break;
      case 'ENGINE_READY':
        updateEngineStatus('ready', 'Ready');
        break;
      case 'ENGINE_ERROR':
        updateEngineStatus('error', 'Error');
        break;
      case 'POSITION_UPDATE':
        if (message.payload?.opening) updateOpeningPanel(message.payload.opening);
        if (message.payload?.opponentStats) updateOpponentPanel(message.payload.opponentStats);
        break;
    }
  });

  // Quick settings handlers
  const thinkTime = document.getElementById('sp-think-time') as HTMLInputElement;
  thinkTime?.addEventListener('change', () => {
    const val = parseFloat(thinkTime.value);
    if (val >= 0.5 && val <= 30) {
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATE',
        payload: { engine: { thinkTime: val } },
      });
    }
  });

  const depth = document.getElementById('sp-depth') as HTMLInputElement;
  depth?.addEventListener('change', () => {
    const val = parseInt(depth.value);
    if (val >= 1 && val <= 30) {
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATE',
        payload: { engine: { depth: val } },
      });
    }
  });

  const elo = document.getElementById('sp-elo') as HTMLSelectElement;
  elo?.addEventListener('change', () => {
    const eloVal = elo.value === 'max' ? null : parseInt(elo.value);
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATE',
      payload: { engine: { elo: eloVal, limitStrength: eloVal !== null } },
    });
  });

  const accuracyTarget = document.getElementById('sp-accuracy-target') as HTMLInputElement;
  accuracyTarget?.addEventListener('change', () => {
    const val = parseInt(accuracyTarget.value);
    if (val >= 30 && val <= 100) {
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATE',
        payload: { randomization: { accuracy: { target: val, tolerance: 5, strength: 50 } } },
      });
    }
  });

  // Load current settings
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (response?.settings) {
      applySettingsToPanel(response.settings);
    }
  });
}

function checkEngineStatus(): void {
  chrome.runtime.sendMessage({ type: 'ENGINE_STATUS' }, (response) => {
    if (response?.ready) {
      updateEngineStatus('ready', 'Ready');
    } else {
      updateEngineStatus('ready', 'Initializing...');
      // Trigger engine initialization
      chrome.runtime.sendMessage({
        type: 'ANALYZE',
        payload: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
      });
    }
  });
}

function updateEngineStatus(state: string, text: string): void {
  const dot = document.getElementById('sp-status-dot');
  const textEl = document.getElementById('sp-status-text');
  if (dot) {
    dot.style.background = state === 'ready' ? 'var(--green)' :
                           state === 'analyzing' ? 'var(--yellow)' :
                           state === 'error' ? 'var(--red)' : 'var(--text-muted)';
  }
  if (textEl) textEl.textContent = text;
}

function updateEvalBar(result: any): void {
  const whiteBar = document.getElementById('eval-white');
  const evalText = document.getElementById('eval-text');
  if (!whiteBar || !evalText) return;

  let percentage: number;
  let displayText: string;

  if (result.mateDistance !== null) {
    if (result.mateDistance > 0) {
      percentage = 95;
      displayText = `M${result.mateDistance}`;
    } else {
      percentage = 5;
      displayText = `M${Math.abs(result.mateDistance)}`;
    }
  } else {
    const cp = result.evaluation;
    percentage = 50 + (50 * (2 / (1 + Math.exp(-cp / 200)) - 1));
    percentage = Math.max(2, Math.min(98, percentage));
    const absCp = Math.abs(cp / 100);
    displayText = cp >= 0 ? `+${absCp.toFixed(1)}` : `-${absCp.toFixed(1)}`;
  }

  whiteBar.style.height = `${percentage}%`;
  evalText.textContent = displayText;
}

function updateAnalysisPanel(result: any): void {
  const container = document.getElementById('analysis-lines');
  if (!container) return;

  updateEngineStatus('ready', `Depth ${result.depth}/${result.selDepth}`);

  const engineInfo = document.getElementById('sp-engine-info');
  if (engineInfo) {
    engineInfo.textContent = `Depth ${result.depth} | ${(result.nodes / 1000).toFixed(0)}k nodes | ${(result.nps / 1000).toFixed(0)}k nps`;
  }

  if (!result.multiPV || result.multiPV.length === 0) {
    container.innerHTML = '<div class="empty-state">No analysis available</div>';
    return;
  }

  let html = '';
  for (const line of result.multiPV) {
    const isBest = line.rank === 1;
    const evalStr = line.mateDistance !== null
      ? (line.mateDistance > 0 ? `M${line.mateDistance}` : `-M${Math.abs(line.mateDistance)}`)
      : (line.evaluation >= 0 ? `+${(line.evaluation / 100).toFixed(2)}` : (line.evaluation / 100).toFixed(2));

    const evalClass = line.evaluation > 20 ? 'positive' : line.evaluation < -20 ? 'negative' : '';
    const pvStr = line.pv.slice(0, 8).join(' ');

    html += `
      <div class="analysis-line">
        <div class="line-rank ${isBest ? 'best' : ''}">${line.rank}</div>
        <div class="line-eval ${evalClass}">${evalStr}</div>
        <div class="line-pv">${pvStr}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function updateOpeningPanel(opening: any): void {
  const nameEl = document.getElementById('sp-opening-name');
  const movesEl = document.getElementById('sp-opening-moves');

  if (nameEl) {
    nameEl.textContent = opening.openingName || 'Unknown Opening';
  }

  if (movesEl && opening.moves) {
    movesEl.innerHTML = '';
    for (const move of opening.moves) {
      const span = document.createElement('span');
      span.className = `opening-move ${move.isMainLine ? 'main' : ''}`;
      span.textContent = move.san;
      if (move.games) {
        span.title = `${move.games.toLocaleString()} games`;
      }
      movesEl.appendChild(span);
    }
  }
}

function updateOpponentPanel(stats: any): void {
  const container = document.getElementById('opponent-panel');
  if (!container) return;

  if (stats.error) {
    container.innerHTML = `<div class="empty-state">Could not load: ${stats.error}</div>`;
    return;
  }

  let html = '';

  if (stats.username) {
    html += `<div class="opponent-row">
      <span class="opponent-label">Player</span>
      <span class="opponent-value">${stats.title || ''} ${stats.username}</span>
    </div>`;
  }

  const ratings = [
    { key: 'blitz', label: 'Blitz' },
    { key: 'rapid', label: 'Rapid' },
    { key: 'bullet', label: 'Bullet' },
    { key: 'daily', label: 'Daily' },
  ];

  for (const { key, label } of ratings) {
    if (stats.ratings?.[key]) {
      html += `<div class="opponent-row">
        <span class="opponent-label">${label}</span>
        <span class="opponent-value">${stats.ratings[key].current}</span>
      </div>`;
    }
  }

  if (stats.stats?.winRate !== undefined) {
    html += `<div class="opponent-row">
      <span class="opponent-label">Win Rate</span>
      <span class="opponent-value">${stats.stats.winRate}%</span>
    </div>`;
  }

  if (stats.stats?.totalGames) {
    html += `<div class="opponent-row">
      <span class="opponent-label">Games</span>
      <span class="opponent-value">${stats.stats.totalGames.toLocaleString()}</span>
    </div>`;
  }

  container.innerHTML = html || '<div class="empty-state">No data available</div>';
}

function applySettingsToPanel(settings: any): void {
  if (settings.engine) {
    const thinkTime = document.getElementById('sp-think-time') as HTMLInputElement;
    if (thinkTime && settings.engine.thinkTime) thinkTime.value = String(settings.engine.thinkTime);

    const depth = document.getElementById('sp-depth') as HTMLInputElement;
    if (depth && settings.engine.depth) depth.value = String(settings.engine.depth);

    if (settings.engine.elo !== undefined) {
      const elo = document.getElementById('sp-elo') as HTMLSelectElement;
      if (elo) elo.value = settings.engine.elo === null ? 'max' : String(settings.engine.elo);
    }
  }

  if (settings.randomization?.accuracy?.target) {
    const accuracy = document.getElementById('sp-accuracy-target') as HTMLInputElement;
    if (accuracy) accuracy.value = String(settings.randomization.accuracy.target);
  }
}

// Session timer
let sessionSeconds = 0;
function startSessionTimer(): void {
  setInterval(() => {
    sessionSeconds++;
    const mins = Math.floor(sessionSeconds / 60);
    const secs = sessionSeconds % 60;
    const timeEl = document.getElementById('sp-time');
    if (timeEl) {
      timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);
}
