/**
 * TimingController - Manages move timing with natural pacing and variation.
 */

import type { TimingConfig, RandomizationConfig } from '../types';

export class TimingController {
  private config: TimingConfig;
  private randomization: RandomizationConfig;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private moveStartTime: number = 0;

  constructor(config: TimingConfig, randomization: RandomizationConfig) {
    this.config = config;
    this.randomization = randomization;
  }

  updateConfig(config: Partial<TimingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  updateRandomization(config: Partial<RandomizationConfig>): void {
    this.randomization = { ...this.randomization, ...config };
  }

  /**
   * Calculate the delay before executing a move.
   * Returns the delay in milliseconds.
   */
  calculateDelay(
    positionComplexity: number, // 0-1, higher = more complex
    isTactical: boolean
  ): number {
    let minMs = this.config.minMoveTime * 1000;
    let maxMs = this.config.maxMoveTime * 1000;

    // Complexity adjustment
    if (this.config.complexityAdjustment) {
      if (isTactical || positionComplexity > 0.7) {
        // Complex positions get more time
        minMs = Math.max(minMs, minMs * 1.5);
        maxMs = Math.max(maxMs, maxMs * 1.2);
      } else if (positionComplexity < 0.3) {
        // Simple positions get less time
        maxMs = Math.min(maxMs, maxMs * 0.7);
      }
    }

    // Randomization for timing
    if (this.randomization.enabled && this.randomization.categories.timing) {
      const variation = this.randomization.timing.variation / 100;
      const timingJitter = 1 + (Math.random() * 2 - 1) * variation;
      minMs *= timingJitter;
      maxMs *= timingJitter;
    } else if (this.config.variation > 0) {
      const variation = this.config.variation / 100;
      const jitter = 1 + (Math.random() * 2 - 1) * variation;
      minMs *= jitter;
      maxMs *= jitter;
    }

    // Calculate actual delay within range
    const delay = minMs + Math.random() * (maxMs - minMs);

    // Add additional delay if configured
    const additionalDelay = this.config.additionalDelay * 1000;
    let totalDelay = delay + additionalDelay;

    // Randomization for additional delay
    if (this.randomization.enabled && this.randomization.categories.delay) {
      const delayVariation = this.randomization.delay.variation / 100;
      const delayJitter = 1 + (Math.random() * 2 - 1) * delayVariation;
      totalDelay = delay + (additionalDelay * delayJitter);
    }

    // Ensure within bounds
    totalDelay = Math.max(minMs, Math.min(maxMs + additionalDelay * 2, totalDelay));

    return Math.round(totalDelay);
  }

  /**
   * Schedule move execution with calculated delay.
   */
  scheduleMoveExecution(
    callback: () => void,
    positionComplexity: number,
    isTactical: boolean
  ): number {
    this.cancelPending();
    this.moveStartTime = Date.now();

    const delay = this.calculateDelay(positionComplexity, isTactical);

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      callback();
    }, delay);

    return delay;
  }

  cancelPending(): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  /**
   * Get the estimated complexity of a position based on engine analysis.
   */
  estimateComplexity(evalChange: number, candidateSpread: number): number {
    // Large eval swing = more complex
    const evalFactor = Math.min(1, Math.abs(evalChange) / 200);

    // Wide spread between candidates = more complex
    const spreadFactor = Math.min(1, candidateSpread / 150);

    return Math.max(evalFactor, spreadFactor);
  }

  /**
   * Determine if a position is tactical.
   */
  isTacticalPosition(
    hasChecks: boolean,
    hasCaptures: boolean,
    evalVolatile: boolean
  ): boolean {
    return hasChecks || (hasCaptures && evalVolatile);
  }

  getEffectiveRange(): { min: number; max: number } {
    return {
      min: this.config.minMoveTime,
      max: this.config.maxMoveTime + this.config.additionalDelay * 2,
    };
  }

  destroy(): void {
    this.cancelPending();
  }
}
