/**
 * MoveSelector - Selects moves from engine candidates based on configuration.
 * Supports deterministic and weighted selection modes.
 */

import type { CandidateMove, AutoPlayConfig, RandomizationConfig } from '../types';

export class MoveSelector {
  private config: AutoPlayConfig;
  private randomization: RandomizationConfig;
  private lastSelectedMove: string | null = null;
  private moveHistory: string[] = [];

  constructor(config: AutoPlayConfig, randomization: RandomizationConfig) {
    this.config = config;
    this.randomization = randomization;
  }

  updateConfig(config: Partial<AutoPlayConfig>): void {
    this.config = { ...this.config, ...config };
  }

  updateRandomization(config: Partial<RandomizationConfig>): void {
    this.randomization = { ...this.randomization, ...config };
  }

  /**
   * Select a move from the candidate list.
   */
  selectMove(candidates: CandidateMove[]): CandidateMove | null {
    if (candidates.length === 0) return null;

    // Filter to top N candidates
    const topN = this.config.candidateTopN;
    const eligible = candidates.slice(0, Math.min(topN, candidates.length));

    // Prevent duplicate moves
    const filtered = eligible.filter(c => c.move !== this.lastSelectedMove);
    const pool = filtered.length > 0 ? filtered : eligible;

    let selected: CandidateMove;

    if (this.config.selectionMode === 'deterministic') {
      selected = pool[0]; // Always pick the best
    } else {
      selected = this.weightedSelect(pool);
    }

    this.lastSelectedMove = selected.move;
    this.moveHistory.push(selected.move);

    return selected;
  }

  /**
   * Weighted selection - favors stronger moves but allows weaker ones.
   * Uses evaluation-based probability weighting.
   */
  private weightedSelect(candidates: CandidateMove[]): CandidateMove {
    if (candidates.length === 1) return candidates[0];

    // Calculate weights based on evaluation differences
    const bestEval = Math.max(...candidates.map(c => c.evaluation));
    const weights = candidates.map(c => {
      const diff = bestEval - c.evaluation;
      // Exponential decay: better moves get much higher weight
      return Math.exp(-diff / 100); // 100cp = ~1 pawn difference
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (let i = 0; i < candidates.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return candidates[i];
      }
    }

    return candidates[0];
  }

  /**
   * Select move with accuracy-based randomization.
   * Varies move quality to achieve target accuracy over a session.
   */
  selectMoveWithAccuracy(
    candidates: CandidateMove[],
    sessionAccuracy: number,
    targetAccuracy: number,
    tolerance: number
  ): CandidateMove | null {
    if (candidates.length === 0) return null;

    const topN = this.config.candidateTopN;
    const eligible = candidates.slice(0, Math.min(topN, candidates.length));

    // Calculate how far we are from target accuracy
    const accuracyDiff = targetAccuracy - sessionAccuracy;
    const normalizedDiff = accuracyDiff / tolerance; // -1 to +1 range

    // If we're below target, favor better moves; if above, allow weaker ones
    const selectionBias = Math.max(0, Math.min(1, 0.5 + normalizedDiff * 0.3));

    // Adjust weights based on bias
    const bestEval = Math.max(...eligible.map(c => c.evaluation));
    const weights = eligible.map((c, idx) => {
      const rankFactor = idx / Math.max(1, eligible.length - 1);
      const evalDiff = bestEval - c.evaluation;
      const baseWeight = Math.exp(-evalDiff / 100);

      // Apply bias: higher bias = more likely to pick best move
      if (selectionBias > 0.5) {
        return baseWeight * (1 + selectionBias);
      } else {
        return baseWeight * (1 + (1 - selectionBias) * rankFactor);
      }
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (let i = 0; i < eligible.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        this.lastSelectedMove = eligible[i].move;
        this.moveHistory.push(eligible[i].move);
        return eligible[i];
      }
    }

    const result = eligible[0];
    this.lastSelectedMove = result.move;
    this.moveHistory.push(result.move);
    return result;
  }

  getLastSelectedMove(): string | null {
    return this.lastSelectedMove;
  }

  getMoveHistory(): string[] {
    return [...this.moveHistory];
  }

  reset(): void {
    this.lastSelectedMove = null;
    this.moveHistory = [];
  }
}
