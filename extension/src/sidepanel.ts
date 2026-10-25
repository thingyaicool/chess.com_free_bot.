/**
 * Side Panel script - Handles the side panel UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Listen for updates from background/content scripts
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'ENGINE_RESULT':
        updateAnalysisPanel(message.payload);
        break;
      case 'POSITION_UPDATE':
        if (message.payload?.opening) updateOpeningPanel(message.payload.opening);
        if (message.payload?.opponentStats) updateOpponentPanel(message.payload.opponentStats);
        break;
    }
  });

  // Request current state
  chrome.runtime.sendMessage({ type: 'ENGINE_STATUS' }).then((status: any) => {
    if (!status?.ready) {
      document.getElementById('sp-eval')!.textContent = 'Initializing...';
    }
  });
});

function updateAnalysisPanel(result: any): void {
  const evalEl = document.getElementById('sp-eval');
  const bestMoveEl = document.getElementById('sp-bestmove');
  const depthEl = document.getElementById('sp-depth');

  if (evalEl) {
    if (result.mateDistance !== null) {
      evalEl.textContent = result.mateDistance > 0 ? `M${result.mateDistance}` : `-M${Math.abs(result.mateDistance)}`;
    } else {
      const cp = (result.evaluation / 100).toFixed(2);
      evalEl.textContent = result.evaluation >= 0 ? `+${cp}` : cp;
    }
  }

  if (bestMoveEl) {
    bestMoveEl.textContent = result.bestMove || '--';
  }

  if (depthEl) {
    depthEl.textContent = `${result.depth}/${result.selDepth}`;
  }
}

function updateOpeningPanel(opening: any): void {
  const nameEl = document.getElementById('sp-opening-name');
  const movesEl = document.getElementById('sp-opening-moves');

  if (nameEl) {
    nameEl.textContent = opening.openingName || 'Unknown Opening';
  }

  if (movesEl && opening.moves) {
    movesEl.innerHTML = '';
    opening.moves.forEach((move: any) => {
      const span = document.createElement('span');
      span.className = `opening-move ${move.isMainLine ? 'main' : ''}`;
      span.textContent = move.san;
      movesEl.appendChild(span);
    });
  }
}

function updateOpponentPanel(stats: any): void {
  const container = document.getElementById('sp-opponent-stats');
  if (!container) return;

  if (stats.error) {
    container.innerHTML = `<div class="empty-state">Could not load stats: ${stats.error}</div>`;
    return;
  }

  let html = `
    <div class="stat-row">
      <span class="stat-label">Username</span>
      <span class="stat-value">${stats.title || ''} ${stats.username}</span>
    </div>
  `;

  if (stats.ratings?.blitz) {
    html += `
      <div class="stat-row">
        <span class="stat-label">Blitz</span>
        <span class="stat-value">${stats.ratings.blitz.current}</span>
      </div>
    `;
  }

  if (stats.ratings?.rapid) {
    html += `
      <div class="stat-row">
        <span class="stat-label">Rapid</span>
        <span class="stat-value">${stats.ratings.rapid.current}</span>
      </div>
    `;
  }

  if (stats.ratings?.bullet) {
    html += `
      <div class="stat-row">
        <span class="stat-label">Bullet</span>
        <span class="stat-value">${stats.ratings.bullet.current}</span>
      </div>
    `;
  }

  if (stats.stats?.winRate !== undefined) {
    html += `
      <div class="stat-row">
        <span class="stat-label">Win Rate</span>
        <span class="stat-value">${stats.stats.winRate}%</span>
      </div>
    `;
  }

  if (stats.stats?.totalGames) {
    html += `
      <div class="stat-row">
        <span class="stat-label">Total Games</span>
        <span class="stat-value">${stats.stats.totalGames.toLocaleString()}</span>
      </div>
    `;
  }

  container.innerHTML = html;
}
