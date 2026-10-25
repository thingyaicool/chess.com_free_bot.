/**
 * Content Script - Injected into chess.com pages.
 * Handles board state reading, overlay rendering, and communication with background.
 * Designed to be resilient to DOM changes.
 */

import { BoardAdapter } from './services/BoardAdapter';
import { HangingPieceDetector } from './services/HangingPieceDetector';
import { OpeningBookService } from './services/OpeningBookService';
import type { GameState, EngineResult, HangingPiece, ExtensionMessage } from './types';

class ChessTrainingContent {
  private boardAdapter: BoardAdapter;
  private hangingPieceDetector: HangingPieceDetector;
  private openingBook: OpeningBookService;
  private currentResult: EngineResult | null = null;
  private hangingPieces: HangingPiece[] = [];
  private overlayContainer: HTMLElement | null = null;
  private evalBar: HTMLElement | null = null;
  private settings: any = {};
  private analysisDebounce: ReturnType<typeof setTimeout> | null = null;
  private lastFenAnalyzed: string = '';

  constructor() {
    this.boardAdapter = new BoardAdapter();
    this.hangingPieceDetector = new HangingPieceDetector();
    this.openingBook = new OpeningBookService();
  }

  initialize(): void {
    console.log('[CTA] Chess Training Assistant content script loaded');

    // Load settings
    this.loadSettings();

    // Create overlay container
    this.createOverlayContainer();

    // Set up board observation
    this.boardAdapter.setPositionChangeCallback((state) => this.onPositionChange(state));
    this.boardAdapter.setGameOverCallback((result) => this.onGameOver(result));

    // Start observing with a delay to let the page load
    setTimeout(() => {
      this.boardAdapter.startObserving();
    }, 2000);

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
      this.handleMessage(message);
    });

    // Create UI elements
    this.createEvalBar();

    // Listen for settings changes
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes['chess-training-assistant-settings']) {
          this.settings = changes['chess-training-assistant-settings'].newValue || {};
        }
      });
    }
  }

  private loadSettings(): void {
    chrome.storage?.sync?.get('chess-training-assistant-settings', (result) => {
      this.settings = result['chess-training-assistant-settings'] || {};
    });
  }

  private createOverlayContainer(): void {
    // Avoid duplicate containers
    if (document.getElementById('chess-training-overlay')) return;

    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'chess-training-overlay';
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99999;
    `;
    document.body.appendChild(this.overlayContainer);
  }

  private createEvalBar(): void {
    if (!this.overlayContainer) return;

    // Avoid duplicates
    if (document.getElementById('cta-eval-bar')) return;

    this.evalBar = document.createElement('div');
    this.evalBar.id = 'cta-eval-bar';
    this.evalBar.style.cssText = `
      position: fixed;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 300px;
      background: #302e2b;
      border-radius: 4px;
      overflow: hidden;
      pointer-events: auto;
      display: flex;
      flex-direction: column-reverse;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      z-index: 100000;
    `;

    const whitePortion = document.createElement('div');
    whitePortion.id = 'cta-eval-white';
    whitePortion.style.cssText = `
      width: 100%;
      height: 50%;
      background: #eeeed2;
      transition: height 0.3s ease;
    `;

    const evalText = document.createElement('div');
    evalText.id = 'cta-eval-text';
    evalText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: bold;
      font-family: monospace;
      color: #888;
      white-space: nowrap;
    `;
    evalText.textContent = '0.0';

    this.evalBar.appendChild(whitePortion);
    this.evalBar.appendChild(evalText);
    this.overlayContainer.appendChild(this.evalBar);
  }

  private onPositionChange(state: GameState): void {
    // Debounce analysis requests
    if (this.analysisDebounce) {
      clearTimeout(this.analysisDebounce);
    }

    this.analysisDebounce = setTimeout(() => {
      this.requestAnalysis(state);
    }, 200);

    // Detect hanging pieces
    try {
      const chess = this.boardAdapter.getChessInstance();
      this.hangingPieces = this.hangingPieceDetector.detectHangingPieces(chess);
      this.updateHangingPieceHighlights();
    } catch (e) {
      // Ignore chess.js errors
    }

    // Check opening book
    try {
      const chess = this.boardAdapter.getChessInstance();
      const moveNumber = Math.floor(state.moveHistory.length / 2) + 1;
      const openingRec = this.openingBook.getRecommendation(chess, moveNumber);
      if (openingRec) {
        this.sendToBackground({
          type: 'POSITION_UPDATE',
          payload: { opening: openingRec },
        });
      }
    } catch (e) {
      // Ignore
    }

    // Forward position to background for opponent stats
    if (state.opponentUsername) {
      this.sendToBackground({
        type: 'GET_OPPONENT_STATS',
        payload: { username: state.opponentUsername },
      });
    }
  }

  private requestAnalysis(state: GameState): void {
    if (state.fen === this.lastFenAnalyzed) return;
    this.lastFenAnalyzed = state.fen;

    const thinkTime = this.settings?.engine?.thinkTime || 3;
    const depth = this.settings?.engine?.depth || 15;

    this.sendToBackground({
      type: 'ANALYZE',
      payload: {
        fen: state.fen,
        thinkTime,
        depth,
        useThinkTime: true,
      },
    });
  }

  private onGameOver(_result: { winner: 'white' | 'black' | 'draw' | null }): void {
    console.log('[CTA] Game over');
    this.clearHighlights();
  }

  private handleMessage(message: ExtensionMessage): void {
    switch (message.type) {
      case 'ENGINE_RESULT':
        this.currentResult = message.payload;
        this.updateEvalBar(message.payload);
        break;

      case 'ENGINE_ERROR':
        console.error('[CTA] Engine error:', message.payload?.error);
        break;

      case 'OPPONENT_STATS_RESULT':
        this.sendToBackground({
          type: 'POSITION_UPDATE',
          payload: { opponentStats: message.payload },
        });
        break;
    }
  }

  private updateEvalBar(result: EngineResult): void {
    const whitePortion = document.getElementById('cta-eval-white');
    const evalText = document.getElementById('cta-eval-text');

    if (!whitePortion || !evalText) return;

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

    whitePortion.style.height = `${percentage}%`;
    evalText.textContent = displayText;
    evalText.style.color = percentage > 50 ? '#333' : '#ccc';
  }

  private updateHangingPieceHighlights(): void {
    // Remove old highlights
    document.querySelectorAll('.cta-hanging-highlight').forEach(el => el.remove());

    if (!this.settings?.hangingPieceDetection?.enabled) return;

    for (const hp of this.hangingPieces) {
      const squareEl = document.querySelector(`[class*="${hp.square}"]`);
      if (!squareEl) continue;

      const highlight = document.createElement('div');
      highlight.className = `cta-hanging-highlight ${hp.threatLevel}`;

      const rect = squareEl.getBoundingClientRect();
      highlight.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: auto;
        cursor: pointer;
        border-radius: 2px;
        box-sizing: border-box;
      `;

      highlight.title = hp.description;
      this.overlayContainer?.appendChild(highlight);
    }
  }

  private clearHighlights(): void {
    document.querySelectorAll('.cta-hanging-highlight').forEach(el => el.remove());
  }

  private sendToBackground(message: ExtensionMessage): void {
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      // Extension context might be invalidated
    }
  }

  destroy(): void {
    this.boardAdapter.stopObserving();
    if (this.analysisDebounce) clearTimeout(this.analysisDebounce);
    this.overlayContainer?.remove();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChessTrainingContent().initialize();
  });
} else {
  new ChessTrainingContent().initialize();
}
