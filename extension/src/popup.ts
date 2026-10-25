/**
 * Popup script - Handles UI interactions in the extension popup.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Toggle handlers
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const id = toggle.id;
      const isActive = toggle.classList.contains('active');

      // Send setting update
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATE',
        payload: getSettingFromToggle(id, isActive),
      });
    });
  });

  // Variation slider
  const variationSlider = document.getElementById('variation') as HTMLInputElement;
  const variationVal = document.getElementById('variation-val');
  variationSlider?.addEventListener('input', () => {
    if (variationVal) variationVal.textContent = `${variationSlider.value}%`;
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = (btn as HTMLElement).dataset.preset;
      applyPreset(preset || 'balanced');
    });
  });

  // Control buttons
  document.getElementById('btn-start')?.addEventListener('click', () => {
    updateStatus('analyzing', 'Analyzing...');
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATE', payload: { autoPlay: { enabled: true, status: 'analyzing' } } });
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    updateStatus('ready', 'Paused');
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATE', payload: { autoPlay: { status: 'paused' } } });
  });

  document.getElementById('btn-stop')?.addEventListener('click', () => {
    updateStatus('ready', 'Stopped');
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATE', payload: { autoPlay: { enabled: false, status: 'idle' } } });
  });

  // Listen for engine results
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ENGINE_RESULT') {
      updateEvalDisplay(message.payload);
    }
    if (message.type === 'ENGINE_STATUS') {
      const { ready, analyzing } = message.payload;
      if (analyzing) updateStatus('analyzing', 'Analyzing...');
      else if (ready) updateStatus('ready', 'Ready');
    }
  });

  // Load current settings
  chrome.storage?.sync?.get('chess-training-assistant-settings', (result) => {
    const settings = result['chess-training-assistant-settings'];
    if (settings) {
      applySettingsToUI(settings);
    }
  });
});

function getSettingFromToggle(id: string, active: boolean): any {
  const map: Record<string, any> = {
    'randomization-toggle': { randomization: { enabled: active } },
    'autoplay-toggle': { autoPlay: { enabled: active } },
    'autonext-toggle': { autoNextGame: { enabled: active } },
    'toggle-evalbar': { ui: { showEvalBar: active } },
    'toggle-hanging': { ui: { showHangingPieces: active } },
    'toggle-opening': { ui: { showOpeningBook: active } },
    'toggle-stats': { ui: { showOpponentStats: active } },
  };
  return map[id] || {};
}

function updateStatus(state: string, text: string): void {
  const dot = document.getElementById('engine-status-dot');
  const textEl = document.getElementById('engine-status-text');
  if (dot) {
    dot.className = `status-dot ${state}`;
  }
  if (textEl) {
    textEl.textContent = text;
  }
}

function updateEvalDisplay(result: any): void {
  const evalEl = document.getElementById('eval-value');
  const labelEl = document.getElementById('eval-label');

  if (evalEl) {
    if (result.mateDistance !== null) {
      evalEl.textContent = result.mateDistance > 0 ? `M${result.mateDistance}` : `-M${Math.abs(result.mateDistance)}`;
    } else {
      const cp = (result.evaluation / 100).toFixed(2);
      evalEl.textContent = result.evaluation >= 0 ? `+${cp}` : cp;
    }
  }

  if (labelEl) {
    labelEl.textContent = `Depth: ${result.depth} | Nodes: ${(result.nodes / 1000).toFixed(0)}k`;
  }

  updateStatus('ready', 'Ready');
}

function applyPreset(preset: string): void {
  const presets: Record<string, any> = {
    consistent: {
      randomization: { enabled: false, accuracy: { target: 95, tolerance: 2, strength: 10 } },
    },
    balanced: {
      randomization: { enabled: true, accuracy: { target: 80, tolerance: 5, strength: 50 } },
    },
    variable: {
      randomization: { enabled: true, accuracy: { target: 70, tolerance: 10, strength: 70 } },
    },
  };

  chrome.runtime.sendMessage({
    type: 'SETTINGS_UPDATE',
    payload: presets[preset] || presets.balanced,
  });
}

function applySettingsToUI(settings: any): void {
  // Apply saved settings to UI elements
  if (settings.engine?.elo) {
    const eloSelect = document.getElementById('elo-select') as HTMLSelectElement;
    if (eloSelect) eloSelect.value = String(settings.engine.elo);
  }
  if (settings.autoPlay?.candidateTopN) {
    const candSelect = document.getElementById('candidates-select') as HTMLSelectElement;
    if (candSelect) candSelect.value = String(settings.autoPlay.candidateTopN);
  }
}
