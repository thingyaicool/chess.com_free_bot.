/**
 * Popup script - Handles UI interactions in the extension popup.
 * Connects UI controls to background service worker.
 */

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadSettings();
  checkEngineStatus();
});

function initializeUI(): void {
  // Toggle handlers
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const id = toggle.id;
      const isActive = toggle.classList.contains('active');
      sendSetting(getSettingFromToggle(id, isActive));
    });
  });

  // Elo select
  const eloSelect = document.getElementById('elo-select') as HTMLSelectElement;
  eloSelect?.addEventListener('change', () => {
    const elo = eloSelect.value === 'max' ? null : parseInt(eloSelect.value);
    sendSetting({ engine: { elo, limitStrength: elo !== null } });
    updateEloInfo(elo);
  });

  // Think time
  const thinkTime = document.getElementById('think-time') as HTMLInputElement;
  thinkTime?.addEventListener('change', () => {
    const val = parseFloat(thinkTime.value);
    if (val >= 0.5 && val <= 30) {
      sendSetting({ engine: { thinkTime: val } });
    }
  });

  // Depth
  const depth = document.getElementById('depth') as HTMLInputElement;
  depth?.addEventListener('change', () => {
    const val = parseInt(depth.value);
    if (val >= 1 && val <= 30) {
      sendSetting({ engine: { depth: val } });
    }
  });

  // Analysis mode
  const analysisMode = document.getElementById('analysis-mode') as HTMLSelectElement;
  analysisMode?.addEventListener('change', () => {
    // Toggle between think time and depth modes
    const useThinkTime = analysisMode.value === 'thinktime';
    sendSetting({ engine: { moveTime: useThinkTime ? null : undefined } });
  });

  // Candidates
  const candidates = document.getElementById('candidates-select') as HTMLSelectElement;
  candidates?.addEventListener('change', () => {
    sendSetting({ autoPlay: { candidateTopN: parseInt(candidates.value) } });
  });

  // Target accuracy
  const accuracy = document.getElementById('target-accuracy') as HTMLInputElement;
  accuracy?.addEventListener('change', () => {
    const val = parseInt(accuracy.value);
    if (val >= 30 && val <= 100) {
      sendSetting({ randomization: { accuracy: { target: val, tolerance: 5, strength: 50 } } });
    }
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = (btn as HTMLElement).dataset.preset;
      applyAccuracyPreset(preset || 'balanced');
    });
  });

  // Control buttons
  document.getElementById('btn-start')?.addEventListener('click', () => {
    updateStatus('analyzing', 'Analyzing...');
    sendSetting({ autoPlay: { enabled: true, status: 'analyzing' } });
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    updateStatus('ready', 'Paused');
    sendSetting({ autoPlay: { status: 'paused' } });
  });

  document.getElementById('btn-stop')?.addEventListener('click', () => {
    updateStatus('ready', 'Stopped');
    sendSetting({ autoPlay: { enabled: false, status: 'idle' } });
  });

  // Footer links
  document.getElementById('open-sidepanel')?.addEventListener('click', () => {
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ windowId: undefined });
    }
  });

  document.getElementById('open-settings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage?.();
  });

  // Listen for engine results
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ENGINE_RESULT') {
      updateEvalDisplay(message.payload);
    }
    if (message.type === 'ENGINE_READY') {
      updateStatus('ready', 'Ready');
    }
    if (message.type === 'ENGINE_ERROR') {
      updateStatus('error', 'Error');
    }
  });
}

function loadSettings(): void {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (response?.settings) {
      applySettingsToUI(response.settings);
    }
  });
}

function checkEngineStatus(): void {
  chrome.runtime.sendMessage({ type: 'ENGINE_STATUS' }, (response) => {
    if (response?.ready) {
      updateStatus('ready', 'Ready');
    } else if (response?.analyzing) {
      updateStatus('analyzing', 'Analyzing...');
    } else {
      updateStatus('ready', 'Initializing...');
      // Try to initialize engine
      chrome.runtime.sendMessage({ type: 'ANALYZE', payload: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' } });
    }
  });
}

function sendSetting(payload: any): void {
  chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATE', payload });
}

function getSettingFromToggle(id: string, active: boolean): any {
  const map: Record<string, any> = {
    'randomization-toggle': { randomization: { enabled: active } },
    'autoplay-toggle': { autoPlay: { enabled: active } },
    'autonext-toggle': { autoNextGame: { enabled: active } },
  };
  return map[id] || {};
}

function updateStatus(state: string, text: string): void {
  const dot = document.getElementById('engine-status-dot');
  const textEl = document.getElementById('engine-status-text');
  if (dot) dot.className = `status-dot ${state}`;
  if (textEl) textEl.textContent = text;
}

function updateEvalDisplay(result: any): void {
  const badge = document.getElementById('eval-badge');
  if (!badge) return;

  if (result.mateDistance !== null) {
    badge.textContent = result.mateDistance > 0 ? `M${result.mateDistance}` : `-M${Math.abs(result.mateDistance)}`;
  } else {
    const cp = (result.evaluation / 100).toFixed(1);
    badge.textContent = result.evaluation >= 0 ? `+${cp}` : cp;
  }

  updateStatus('ready', `Depth ${result.depth}`);
}

function updateEloInfo(elo: number | null): void {
  const info = document.getElementById('elo-info');
  if (!info) return;

  const descriptions: Record<string, string> = {
    'max': '<strong>Maximum</strong> — Full engine strength',
    '2500': '<strong>Grandmaster</strong> — near-perfect play',
    '2200': '<strong>Expert</strong> — strong positional play',
    '2000': '<strong>Advanced</strong> — deep calculation',
    '1800': '<strong>Strong Club</strong> — good tactical vision',
    '1600': '<strong>Club Player</strong> — solid fundamentals',
    '1400': '<strong>Intermediate</strong> — sees simple tactics',
    '1200': '<strong>Casual</strong> — plays reasonable moves',
    '1000': '<strong>Beginner</strong> — knows basic tactics',
    '800': '<strong>Novice</strong> — learning the basics',
    '400': '<strong>Very Beginner</strong> — makes frequent mistakes',
  };

  info.innerHTML = descriptions[String(elo)] || '<strong>Custom</strong>';
}

function applyAccuracyPreset(preset: string): void {
  const presets: Record<string, any> = {
    casual: { target: 60, tolerance: 10, strength: 30 },
    balanced: { target: 75, tolerance: 7, strength: 50 },
    strong: { target: 85, tolerance: 5, strength: 70 },
    masterful: { target: 93, tolerance: 3, strength: 90 },
  };

  const config = presets[preset] || presets.balanced;
  sendSetting({
    randomization: {
      enabled: true,
      accuracy: config,
      categories: { opening: true, timing: true, delay: true, moves: true, accuracy: true },
    }
  });

  // Update UI
  const accuracyInput = document.getElementById('target-accuracy') as HTMLInputElement;
  if (accuracyInput) accuracyInput.value = String(config.target);

  const toggle = document.getElementById('randomization-toggle');
  if (toggle && !toggle.classList.contains('active')) {
    toggle.classList.add('active');
  }
}

function applySettingsToUI(settings: any): void {
  if (settings.engine) {
    const thinkTime = document.getElementById('think-time') as HTMLInputElement;
    if (thinkTime && settings.engine.thinkTime) thinkTime.value = String(settings.engine.thinkTime);

    const depth = document.getElementById('depth') as HTMLInputElement;
    if (depth && settings.engine.depth) depth.value = String(settings.engine.depth);

    if (settings.engine.elo !== undefined) {
      const eloSelect = document.getElementById('elo-select') as HTMLSelectElement;
      if (eloSelect) eloSelect.value = settings.engine.elo === null ? 'max' : String(settings.engine.elo);
      updateEloInfo(settings.engine.elo);
    }
  }

  if (settings.autoPlay?.candidateTopN) {
    const cand = document.getElementById('candidates-select') as HTMLSelectElement;
    if (cand) cand.value = String(settings.autoPlay.candidateTopN);
  }

  if (settings.randomization) {
    const toggle = document.getElementById('randomization-toggle');
    if (toggle && settings.randomization.enabled) toggle.classList.add('active');

    const accuracy = document.getElementById('target-accuracy') as HTMLInputElement;
    if (accuracy && settings.randomization.accuracy?.target) {
      accuracy.value = String(settings.randomization.accuracy.target);
    }
  }

  if (settings.autoPlay?.enabled) {
    document.getElementById('autoplay-toggle')?.classList.add('active');
  }
  if (settings.autoNextGame?.enabled) {
    document.getElementById('autonext-toggle')?.classList.add('active');
  }
}
