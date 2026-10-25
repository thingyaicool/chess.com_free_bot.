/**
 * AutoGameController - Manages automatic game progression.
 */

import type { AutoNextGameConfig } from '../types';

export class AutoGameController {
  private config: AutoNextGameConfig;
  private gamesPlayed = 0;
  private sessionStartTime: number | null = null;
  private nextGameTimer: ReturnType<typeof setTimeout> | null = null;
  private isPaused = false;
  private onTriggerNextGame: (() => void) | null = null;
  private onSessionLimitReached: (() => void) | null = null;

  constructor(config: AutoNextGameConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<AutoNextGameConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start tracking a new session.
   */
  startSession(): void {
    this.gamesPlayed = 0;
    this.sessionStartTime = Date.now();
    this.isPaused = false;
  }

  /**
   * Called when a game ends. Decides whether to start the next game.
   */
  onGameEnd(): void {
    if (!this.config.enabled || this.isPaused) return;

    this.gamesPlayed++;

    // Check game limit
    if (this.config.maxGames !== null && this.gamesPlayed >= this.config.maxGames) {
      this.onSessionLimitReached?.();
      return;
    }

    // Check duration limit
    if (this.config.maxDuration !== null && this.sessionStartTime) {
      const elapsedMinutes = (Date.now() - this.sessionStartTime) / 60000;
      if (elapsedMinutes >= this.config.maxDuration) {
        this.onSessionLimitReached?.();
        return;
      }
    }

    // Schedule next game
    this.scheduleNextGame();
  }

  private scheduleNextGame(): void {
    this.cancelPending();

    const delayMs = this.config.delay * 1000;

    this.nextGameTimer = setTimeout(() => {
      this.nextGameTimer = null;

      if (this.config.requireConfirmation) {
        // Dispatch a custom event for the UI to handle
        window.dispatchEvent(new CustomEvent('chess-assistant-confirm-next-game', {
          detail: { gamesPlayed: this.gamesPlayed },
        }));
      } else {
        this.triggerNextGame();
      }
    }, delayMs);
  }

  private triggerNextGame(): void {
    // Look for the "New Game" or "Play Again" button on chess.com
    const newGameButton = this.findNewGameButton();
    if (newGameButton) {
      (newGameButton as HTMLElement).click();
      this.onTriggerNextGame?.();
    } else {
      console.warn('[AutoGameController] Could not find new game button');
      if (this.config.pauseOnError) {
        this.pause();
      }
    }
  }

  private findNewGameButton(): Element | null {
    const selectors = [
      'button[data-cy="new-game"]',
      '.game-over-modal button[class*="play"]',
      'button[class*="new-game"]',
      '.modal button[class*="again"]',
      '[class*="play-again"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  pause(): void {
    this.isPaused = true;
    this.cancelPending();
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.cancelPending();
    this.isPaused = false;
    this.gamesPlayed = 0;
    this.sessionStartTime = null;
  }

  private cancelPending(): void {
    if (this.nextGameTimer) {
      clearTimeout(this.nextGameTimer);
      this.nextGameTimer = null;
    }
  }

  confirmNextGame(): void {
    this.triggerNextGame();
  }

  getGamesPlayed(): number {
    return this.gamesPlayed;
  }

  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return (Date.now() - this.sessionStartTime) / 60000;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  setNextGameCallback(callback: () => void): void {
    this.onTriggerNextGame = callback;
  }

  setSessionLimitCallback(callback: () => void): void {
    this.onSessionLimitReached = callback;
  }

  destroy(): void {
    this.cancelPending();
  }
}
