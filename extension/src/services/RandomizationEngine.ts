/**
 * RandomizationEngine - Sophisticated randomization system for human-like play.
 * Supports independent randomization of opening, timing, delay, moves, and accuracy.
 */

import type { RandomizationConfig, CandidateMove, OpeningMove } from '../types';

// Seeded PRNG (Mulberry32)
function mulberry32(seed: number): () => number {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class RandomizationEngine {
  private config: RandomizationConfig;
  private rng: () => number;
  private sessionAccuracy: number = 100;
  private moveAccuracies: number[] = [];
  private moveCount = 0;

  constructor(config: RandomizationConfig) {
    this.config = config;
    this.rng = config.seed ? mulberry32(this.hashSeed(config.seed)) : Math.random;
  }

  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  updateConfig(config: Partial<RandomizationConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.seed !== undefined) {
      this.rng = config.seed ? mulberry32(this.hashSeed(config.seed)) : Math.random;
    }
  }

  /**
   * Randomize move selection from candidates.
   */
  randomizeMoveSelection(
    candidates: CandidateMove[],
    positionComplexity: number,
    gamePhase: 'opening' | 'middlegame' | 'endgame'
  ): CandidateMove | null {
    if (candidates.length === 0) return null;
    if (!this.config.enabled) return candidates[0];

    let pool = [...candidates];

    // Apply move randomization
    if (this.config.categories.moves) {
      pool = this.applyMoveRandomization(pool, positionComplexity);
    }

    // Apply accuracy randomization
    if (this.config.categories.accuracy) {
      return this.applyAccuracySelection(pool, positionComplexity, gamePhase);
    }

    // Default: weighted selection from pool
    return this.weightedSelect(pool);
  }

  /**
   * Randomize opening selection from book moves.
   */
  randomizeOpeningSelection(bookMoves: OpeningMove[]): OpeningMove | null {
    if (bookMoves.length === 0) return null;
    if (!this.config.enabled || !this.config.categories.opening) {
      return bookMoves.find(m => m.isMainLine) || bookMoves[0];
    }

    const alternatives = Math.min(this.config.opening.alternatives, bookMoves.length);
    const eligible = bookMoves.slice(0, alternatives);

    // Weight by frequency/score
    const weights = eligible.map(m => {
      const baseWeight = (m.games || 1000) / 1000;
      const scoreWeight = (m.score || 50) / 100;
      return baseWeight * scoreWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.rng() * totalWeight;

    for (let i = 0; i < eligible.length; i++) {
      random -= weights[i];
      if (random <= 0) return eligible[i];
    }

    return eligible[0];
  }

  /**
   * Randomize timing delay.
   */
  randomizeTiming(baseDelay: number): number {
    if (!this.config.enabled || !this.config.categories.timing) return baseDelay;

    const variation = this.config.timing.variation / 100;
    const jitter = 1 + (this.rng() * 2 - 1) * variation;
    return Math.round(baseDelay * jitter);
  }

  /**
   * Randomize additional delay.
   */
  randomizeDelay(baseDelay: number): number {
    if (!this.config.enabled || !this.config.categories.delay) return baseDelay;

    const variation = this.config.delay.variation / 100;
    const jitter = 1 + (this.rng() * 2 - 1) * variation;
    return Math.round(baseDelay * jitter);
  }

  /**
   * Apply move randomization - vary selection among candidates.
   */
  private applyMoveRandomization(
    candidates: CandidateMove[],
    complexity: number
  ): CandidateMove[] {
    const topN = this.config.moves.topN;
    const pool = candidates.slice(0, Math.min(topN, candidates.length));

    // In complex positions, allow more variation
    if (complexity > 0.7 && pool.length > 2) {
      return pool;
    }

    // In simple positions, restrict to top moves
    if (complexity < 0.3 && pool.length > 2) {
      return pool.slice(0, 2);
    }

    return pool;
  }

  /**
   * Apply accuracy-based selection.
   * Varies move quality to approach target accuracy over a session.
   */
  private applyAccuracySelection(
    candidates: CandidateMove[],
    complexity: number,
    gamePhase: 'opening' | 'middlegame' | 'endgame'
  ): CandidateMove | null {
    const { target, tolerance, strength } = this.config.accuracy;

    // Calculate how far we are from target
    const accuracyDiff = target - this.sessionAccuracy;
    const normalizedDiff = accuracyDiff / tolerance;

    // Adjust selection based on how close we are to target
    // Positive diff = below target, need better moves
    // Negative diff = above target, can afford weaker moves

    const bestEval = Math.max(...candidates.map(c => c.evaluation));
    const evalRange = Math.max(1, bestEval - Math.min(...candidates.map(c => c.evaluation)));

    // Calculate weights with accuracy bias
    const weights = candidates.map((c, idx) => {
      const qualityFactor = 1 - (idx / Math.max(1, candidates.length - 1));
      const evalFactor = (c.evaluation - (bestEval - evalRange)) / evalRange;

      // Complexity affects how much we deviate
      const complexityFactor = complexity * (strength / 100);

      // Game phase adjustment
      const phaseFactor = gamePhase === 'opening' ? 0.8 : gamePhase === 'endgame' ? 1.2 : 1.0;

      // Accuracy bias
      const bias = normalizedDiff * 0.3 * phaseFactor;

      let weight = qualityFactor * (1 + bias) + evalFactor * complexityFactor;
      return Math.max(0.01, weight);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.rng() * totalWeight;

    for (let i = 0; i < candidates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        this.recordMoveAccuracy(candidates, i);
        return candidates[i];
      }
    }

    this.recordMoveAccuracy(candidates, 0);
    return candidates[0];
  }

  /**
   * Weighted selection from candidates.
   */
  private weightedSelect(candidates: CandidateMove[]): CandidateMove {
    if (candidates.length === 1) return candidates[0];

    if (this.config.moves.weighted) {
      const bestEval = Math.max(...candidates.map(c => c.evaluation));
      const weights = candidates.map(c => Math.exp(-(bestEval - c.evaluation) / 80));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = this.rng() * totalWeight;

      for (let i = 0; i < candidates.length; i++) {
        random -= weights[i];
        if (random <= 0) return candidates[i];
      }
    }

    return candidates[0];
  }

  /**
   * Record the accuracy of a selected move.
   */
  private recordMoveAccuracy(candidates: CandidateMove[], selectedIndex: number): void {
    if (candidates.length <= 1) {
      this.moveAccuracies.push(100);
    } else {
      // Calculate accuracy as percentage of best evaluation retained
      const bestEval = Math.max(...candidates.map(c => c.evaluation));
      const selectedEval = candidates[selectedIndex].evaluation;
      const evalDiff = bestEval - selectedEval;

      // Convert evaluation difference to accuracy percentage
      // 0cp diff = 100% accuracy, 200cp+ diff = ~50% accuracy
      const accuracy = Math.max(0, Math.min(100, 100 - (evalDiff / 2)));
      this.moveAccuracies.push(accuracy);
    }

    this.moveCount++;

    // Update rolling session accuracy
    const recentMoves = this.moveAccuracies.slice(-20); // Last 20 moves
    this.sessionAccuracy = recentMoves.reduce((a, b) => a + b, 0) / recentMoves.length;
  }

  getSessionAccuracy(): number {
    return Math.round(this.sessionAccuracy * 10) / 10;
  }

  getTargetAccuracy(): number {
    return this.config.accuracy.target;
  }

  getMoveAccuracies(): number[] {
    return [...this.moveAccuracies];
  }

  getMoveCount(): number {
    return this.moveCount;
  }

  /**
   * Get session dashboard data.
   */
  getDashboard(): {
    targetAccuracy: number;
    currentAccuracy: number;
    moveCount: number;
    distribution: { excellent: number; good: number; okay: number; weak: number };
    trend: number[];
  } {
    const distribution = { excellent: 0, good: 0, okay: 0, weak: 0 };

    for (const acc of this.moveAccuracies) {
      if (acc >= 90) distribution.excellent++;
      else if (acc >= 70) distribution.good++;
      else if (acc >= 50) distribution.okay++;
      else distribution.weak++;
    }

    // Trend: last 10 moves accuracy
    const trend = this.moveAccuracies.slice(-10);

    return {
      targetAccuracy: this.config.accuracy.target,
      currentAccuracy: this.getSessionAccuracy(),
      moveCount: this.moveCount,
      distribution,
      trend,
    };
  }

  reset(): void {
    this.sessionAccuracy = 100;
    this.moveAccuracies = [];
    this.moveCount = 0;
    if (this.config.seed) {
      this.rng = mulberry32(this.hashSeed(this.config.seed));
    }
  }

  /**
   * Get preset configurations.
   */
  static getPresets(): Record<string, Partial<RandomizationConfig>> {
    return {
      consistent: {
        enabled: false,
        categories: { opening: false, timing: false, delay: false, moves: false, accuracy: false },
        accuracy: { target: 95, tolerance: 2, strength: 10 },
        timing: { variation: 5 },
        delay: { variation: 5 },
        moves: { topN: 1, weighted: false },
        opening: { alternatives: 1 },
      },
      balanced: {
        enabled: true,
        categories: { opening: true, timing: true, delay: true, moves: true, accuracy: true },
        accuracy: { target: 80, tolerance: 5, strength: 50 },
        timing: { variation: 15 },
        delay: { variation: 20 },
        moves: { topN: 3, weighted: true },
        opening: { alternatives: 3 },
        preset: 'balanced',
      },
      variable: {
        enabled: true,
        categories: { opening: true, timing: true, delay: true, moves: true, accuracy: true },
        accuracy: { target: 70, tolerance: 10, strength: 70 },
        timing: { variation: 30 },
        delay: { variation: 40 },
        moves: { topN: 5, weighted: true },
        opening: { alternatives: 5 },
        preset: 'variable',
      },
    };
  }
}
