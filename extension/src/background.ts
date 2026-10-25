/**
 * Background Service Worker - Main entry point for the Chrome extension.
 * Manages engine lifecycle, message routing, and settings persistence.
 * Designed for Manifest V3 service worker lifecycle (may be suspended).
 */

import { EngineManager } from './services/EngineManager';
import { SettingsStore } from './services/SettingsStore';
import { OpponentStatsService } from './services/OpponentStatsService';
import type { ExtensionMessage, EngineResult } from './types';

// Module-level state (survives within a single service worker session)
let engine: EngineManager | null = null;
let engineInitializing = false;
const settingsStore = new SettingsStore();
const opponentStats = new OpponentStatsService();

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed/updated');
  await settingsStore.load();
});

// Get or create engine instance (lazy initialization)
async function getEngine(): Promise<EngineManager> {
  if (engine) {
    const status = engine.getStatus();
    if (status.ready) return engine;
  }

  if (engineInitializing) {
    // Wait for ongoing initialization
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (engine?.getStatus().ready) {
          clearInterval(check);
          resolve(engine!);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve(getEngine()); // Retry
      }, 5000);
    });
  }

  engineInitializing = true;

  try {
    const settings = settingsStore.get();
    engine = new EngineManager(settings.engine);

    engine.onResult((result: EngineResult) => {
      // Broadcast result to all extension pages
      broadcastMessage({ type: 'ENGINE_RESULT', payload: result });
    });

    engine.onError((error: string) => {
      broadcastMessage({ type: 'ENGINE_ERROR', payload: { error } });
    });

    engine.onReady(() => {
      broadcastMessage({ type: 'ENGINE_READY', payload: null });
    });

    await engine.initialize();
    engineInitializing = false;
    return engine;
  } catch (error) {
    engineInitializing = false;
    throw error;
  }
}

// Broadcast message to all extension contexts
function broadcastMessage(message: ExtensionMessage): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners available (popup/sidepanel might be closed)
  });

  // Also try to send to all tabs with content scripts
  chrome.tabs.query({ url: 'https://www.chess.com/*' }).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  }).catch(() => {});
}

// Handle messages from content scripts and popup/sidepanel
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Background] Message handler error:', error);
      sendResponse({ error: error.message || 'Unknown error' });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage, _sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    case 'ANALYZE': {
      try {
        const eng = await getEngine();
        const { fen, depth, thinkTime, useThinkTime } = message.payload || {};

        if (!fen) {
          return { error: 'No FEN provided' };
        }

        // Update engine config from settings
        const settings = settingsStore.get();
        eng.updateConfig(settings.engine);

        eng.analyze(fen, {
          depth: depth || settings.engine.depth,
          thinkTime: thinkTime || settings.engine.thinkTime,
          useThinkTime,
        });

        return { status: 'analyzing' };
      } catch (error) {
        return { error: (error as Error).message };
      }
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
      try {
        const { username, forceRefresh } = message.payload || {};
        if (!username) return { error: 'No username provided' };
        const stats = await opponentStats.getStats(username, forceRefresh);
        return { stats };
      } catch (error) {
        return { error: (error as Error).message };
      }
    }

    case 'SETTINGS_UPDATE': {
      await settingsStore.save(message.payload);
      // Update engine config if engine-related settings changed
      if (engine && message.payload?.engine) {
        engine.updateConfig(message.payload.engine);
      }
      return { status: 'updated' };
    }

    case 'GET_SETTINGS': {
      const settings = settingsStore.get();
      return { settings };
    }

    case 'POSITION_UPDATE': {
      // Forward position updates from content script to popup/sidepanel
      broadcastMessage({
        type: 'POSITION_UPDATE',
        payload: message.payload,
      });
      return { status: 'forwarded' };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// Handle side panel behavior
if (chrome.sidePanel) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

// Cleanup on suspend (MV3 service worker lifecycle)
if (chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(() => {
    console.log('[Background] Service worker suspending');
    engine?.destroy();
    engine = null;
  });
}

console.log('[Background] Service worker loaded');
