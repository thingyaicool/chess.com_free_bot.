/**
 * StrengthController - Manages engine playing strength via UCI_LimitStrength and UCI_Elo.
 */

import type { EngineConfig } from '../types';
import { ELO_PRESETS } from '../types';

export class StrengthController {
  private currentElo: number | null = null;
  private limitStrength: boolean = false;

  /**
   * Set the target Elo rating.
   * Note: Stockfish's UCI_Elo doesn't correspond exactly to human ratings.
   * This is an approximate playing-strength target.
   */
  setElo(elo: number | null): Partial<EngineConfig> {
    this.currentElo = elo;

    if (elo === null || elo >= 3000) {
      // Maximum strength - no limit
      this.limitStrength = false;
      return { elo: null, limitStrength: false };
    }

    this.limitStrength = true;
    // Clamp to Stockfish's supported range
    const clampedElo = Math.max(1320, Math.min(3190, elo));
    return { elo: clampedElo, limitStrength: true };
  }

  /**
   * Get the appropriate depth for the given Elo level.
   * Lower Elo = shallower search to simulate weaker play.
   */
  getDepthForElo(elo: number | null): number {
    if (elo === null || elo >= 2800) return 20;
    if (elo >= 2500) return 18;
    if (elo >= 2200) return 16;
    if (elo >= 2000) return 14;
    if (elo >= 1800) return 12;
    if (elo >= 1600) return 10;
    if (elo >= 1400) return 8;
    if (elo >= 1200) return 6;
    if (elo >= 1000) return 5;
    if (elo >= 800) return 4;
    if (elo >= 600) return 3;
    return 2;
  }

  /**
   * Get the appropriate move time for the given Elo level.
   */
  getMoveTimeForElo(elo: number | null): number | null {
    if (elo === null || elo >= 2800) return null; // Use depth
    if (elo >= 2500) return 3000;
    if (elo >= 2200) return 2000;
    if (elo >= 2000) return 1500;
    if (elo >= 1800) return 1000;
    if (elo >= 1600) return 800;
    if (elo >= 1400) return 600;
    if (elo >= 1200) return 400;
    if (elo >= 1000) return 300;
    if (elo >= 800) return 200;
    return 100;
  }

  getCurrentElo(): number | null {
    return this.currentElo;
  }

  isLimitingStrength(): boolean {
    return this.limitStrength;
  }

  getPresets(): number[] {
    return ELO_PRESETS;
  }

  /**
   * Get a description of the strength level.
   */
  getDescription(elo: number | null): string {
    if (elo === null) return 'Maximum Strength (no limit)';
    if (elo >= 2800) return 'Superhuman';
    if (elo >= 2500) return 'Grandmaster';
    if (elo >= 2200) return 'Expert';
    if (elo >= 2000) return 'Advanced';
    if (elo >= 1800) return 'Strong Club Player';
    if (elo >= 1600) return 'Club Player';
    if (elo >= 1400) return 'Intermediate';
    if (elo >= 1200) return 'Casual Player';
    if (elo >= 1000) return 'Beginner';
    if (elo >= 800) return 'Novice';
    return 'Very Beginner';
  }
}
