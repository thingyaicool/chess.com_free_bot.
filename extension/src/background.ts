/**
 * Background Service Worker - Main entry point for the Chrome extension.
 * Manages engine lifecycle and message routing.
 */

import { EngineManager } from './services/EngineManager';
import { SettingsStore } from './services/SettingsStore';
import { OpponentStatsService } from './services/OpponentStatsService';
import type { ExtensionMessage, EngineResult } from './types';

// Global instances
let engine: EngineManager | null = null;
const settingsStore = new SettingsStore();
const opponentStats = new OpponentStatsService();

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed');
  await settingsStore.load();
});

// Initialize engine when needed
async function getEngine(): Promise<EngineManager> {
  if (!engine) {
    const settings = settingsStore.get();
    engine = new EngineManager(settings.engine);
    await engine.initialize();

    engine.onResult((result: EngineResult) => {
      // Broadcast result to all tabs
      chrome.runtime.sendMessage({
        type: 'ENGINE_RESULT',
        payload: result,
      }).catch(() => {
        // No listeners (popup might be closed)
      });
    });

    engine.onError((error: string) => {
      chrome.runtime.sendMessage({
        type: 'ENGINE_ERROR',
        payload: { error },
      }).catch(() => {});
    });
  }
  return engine;
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    sendResponse({ error: error.message });
  });
  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    case 'ANALYZE': {
      const eng = await getEngine();
      const { fen, depth, moveTime } = message.payload;

      // Update engine config if needed
      const settings = settingsStore.get();
      eng.updateConfig(settings.engine);

      eng.analyze(fen, { depth, moveTime });
      return { status: 'analyzing' };
    }

    case 'CANCEL_ANALYSIS': {
      engine?.cancelAnalysis();
      return { status: 'cancelled' };
    }

    case 'ENGINE_STATUS': {
      if (!engine) return { ready: false, analyzing: false };
      return engine.getStatus();
    }

    case 'GET_OPPONENT_STATS': {
      const { username, forceRefresh } = message.payload;
      const stats = await opponentStats.getStats(username, forceRefresh);
      return { stats };
    }

    case 'SETTINGS_UPDATE': {
      await settingsStore.save(message.payload);
      // Update engine config if engine-related settings changed
      if (engine && message.payload?.engine) {
        engine.updateConfig(message.payload.engine);
      }
      return { status: 'updated' };
    }

    case 'POSITION_UPDATE': {
      // Forward position updates from content script to popup/sidepanel
      chrome.runtime.sendMessage({
        type: 'POSITION_UPDATE',
        payload: message.payload,
      }).catch(() => {});
      return { status: 'forwarded' };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// Handle side panel
chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });

// Cleanup on suspend
chrome.runtime.onSuspend?.addListener(() => {
  engine?.destroy();
  engine = null;
});

console.log('[Background] Service worker loaded');
