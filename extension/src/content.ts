/**
 * Content Script - Injected into chess.com pages.
 * Handles board state reading, overlay rendering, and communication with background.
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

  constructor() {
    this.boardAdapter = new BoardAdapter();
    this.hangingPieceDetector = new HangingPieceDetector();
    this.openingBook = new OpeningBookService();
  }

  initialize(): void {
    console.log('[Content] Chess Training Assistant loaded');

    // Create overlay container
    this.createOverlayContainer();

    // Set up board observation
    this.boardAdapter.setPositionChangeCallback((state) => this.onPositionChange(state));
    this.boardAdapter.setGameOverCallback((result) => this.onGameOver(result));
    this.boardAdapter.startObserving();

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
      this.handleMessage(message);
    });

    // Create UI elements
    this.createEvalBar();
    this.createHangingPieceOverlay();
  }

  private createOverlayContainer(): void {
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

    this.evalBar = document.createElement('div');
    this.evalBar.id = 'cta-eval-bar';
    this.evalBar.style.cssText = `
      position: absolute;
      right: -35px;
      top: 0;
      width: 28px;
      height: 100%;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      pointer-events: auto;
      display: flex;
      flex-direction: column-reverse;
    `;

    // White portion (bottom)
    const whitePortion = document.createElement('div');
    whitePortion.id = 'cta-eval-white';
    whitePortion.style.cssText = `
      width: 100%;
      height: 50%;
      background: #f0f0f0;
      transition: height 0.3s ease;
    `;

    // Black portion (top)
    const blackPortion = document.createElement('div');
    blackPortion.id = 'cta-eval-black';
    blackPortion.style.cssText = `
      width: 100%;
      flex: 1;
      background: #333;
      transition: height 0.3s ease;
    `;

    // Eval text
    const evalText = document.createElement('div');
    evalText.id = 'cta-eval-text';
    evalText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: bold;
      color: #666;
      text-shadow: 0 0 2px white;
      white-space: nowrap;
    `;
    evalText.textContent = '0.0';

    this.evalBar.appendChild(blackPortion);
    this.evalBar.appendChild(whitePortion);
    this.evalBar.appendChild(evalText);
    this.overlayContainer.appendChild(this.evalBar);
  }

  private createHangingPieceOverlay(): void {
    // Hanging piece highlights are added dynamically
  }

  private onPositionChange(state: GameState): void {
    // Request analysis from background
    chrome.runtime.sendMessage({
      type: 'ANALYZE',
      payload: {
        fen: state.fen,
      },
    });

    // Detect hanging pieces
    const chess = this.boardAdapter.getChessInstance();
    this.hangingPieces = this.hangingPieceDetector.detectHangingPieces(chess);
    this.updateHangingPieceHighlights();

    // Check opening book
    const moveNumber = Math.floor(state.moveHistory.length / 2) + 1;
    const openingRec = this.openingBook.getRecommendation(chess, moveNumber);
    if (openingRec) {
      this.updateOpeningDisplay(openingRec);
    }

    // Forward position to background for opponent stats
    if (state.opponentUsername) {
      chrome.runtime.sendMessage({
        type: 'GET_OPPONENT_STATS',
        payload: { username: state.opponentUsername },
      });
    }
  }

  private onGameOver(result: { winner: 'white' | 'black' | 'draw' | null }): void {
    console.log('[Content] Game over:', result);
    this.clearHighlights();
  }

  private handleMessage(message: ExtensionMessage): void {
    switch (message.type) {
      case 'ENGINE_RESULT':
        this.currentResult = message.payload;
        this.updateEvalBar(message.payload);
        break;

      case 'ENGINE_ERROR':
        console.error('[Content] Engine error:', message.payload?.error);
        break;

      case 'OPPONENT_STATS_RESULT':
        this.updateOpponentDisplay(message.payload);
        break;
    }
  }

  private updateEvalBar(result: EngineResult): void {
    if (!this.evalBar) return;

    const whitePortion = document.getElementById('cta-eval-white');
    const evalText = document.getElementById('cta-eval-text');

    if (!whitePortion || !evalText) return;

    let percentage: number;
    let displayText: string;

    if (result.mateDistance !== null) {
      // Mate score
      if (result.mateDistance > 0) {
        percentage = 95; // White mating
        displayText = `M${result.mateDistance}`;
      } else {
        percentage = 5; // Black mating
        displayText = `M${Math.abs(result.mateDistance)}`;
      }
    } else {
      // Centipawn score - convert to percentage using sigmoid-like function
      const cp = result.evaluation;
      percentage = 50 + (50 * (2 / (1 + Math.exp(-cp / 200)) - 1));
      percentage = Math.max(2, Math.min(98, percentage));

      const absCp = Math.abs(cp / 100);
      displayText = cp >= 0 ? `+${absCp.toFixed(1)}` : `-${absCp.toFixed(1)}`;
    }

    whitePortion.style.height = `${percentage}%`;
    evalText.textContent = displayText;
    evalText.style.color = percentage > 50 ? '#333' : '#f0f0f0';
  }

  private updateHangingPieceHighlights(): void {
    // Remove old highlights
    document.querySelectorAll('.cta-hanging-highlight').forEach(el => el.remove());

    // Add new highlights
    for (const hp of this.hangingPieces) {
      const squareEl = document.querySelector(`[class*="${hp.square}"]`);
      if (!squareEl) continue;

      const highlight = document.createElement('div');
      highlight.className = 'cta-hanging-highlight';

      const colors: Record<string, string> = {
        low: 'rgba(59, 130, 246, 0.3)',
        medium: 'rgba(245, 158, 11, 0.4)',
        high: 'rgba(239, 68, 68, 0.4)',
        critical: 'rgba(220, 38, 38, 0.6)',
      };

      highlight.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${colors[hp.threatLevel]};
        border: 2px solid ${hp.isHanging ? '#ef4444' : '#f59e0b'};
        border-radius: 2px;
        pointer-events: auto;
        cursor: pointer;
        box-sizing: border-box;
      `;

      highlight.title = hp.description;

      // Position relative to the square
      const rect = squareEl.getBoundingClientRect();
      highlight.style.position = 'fixed';
      highlight.style.left = `${rect.left}px`;
      highlight.style.top = `${rect.top}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      this.overlayContainer?.appendChild(highlight);
    }
  }

  private updateOpeningDisplay(opening: any): void {
    // Update opening display in the side panel
    chrome.runtime.sendMessage({
      type: 'POSITION_UPDATE',
      payload: { opening },
    });
  }

  private updateOpponentDisplay(stats: any): void {
    chrome.runtime.sendMessage({
      type: 'POSITION_UPDATE',
      payload: { opponentStats: stats },
    });
  }

  private clearHighlights(): void {
    document.querySelectorAll('.cta-hanging-highlight').forEach(el => el.remove());
  }

  destroy(): void {
    this.boardAdapter.stopObserving();
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
