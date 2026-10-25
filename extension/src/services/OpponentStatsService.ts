/**
 * OpponentStatsService - Fetches opponent statistics from Chess.com's public API.
 * Includes caching to avoid rate limits.
 */

import type { OpponentStats, RatingInfo } from '../types';

const API_BASE = 'https://api.chess.com/pub';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: OpponentStats;
  timestamp: number;
}

export class OpponentStatsService {
  private cache: Map<string, CacheEntry> = new Map();

  async getStats(username: string, forceRefresh = false): Promise<OpponentStats> {
    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(username.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const [profile, stats] = await Promise.all([
        this.fetchProfile(username),
        this.fetchStats(username),
      ]);

      const result: OpponentStats = {
        username: profile.username || username,
        avatar: profile.avatar,
        title: profile.title,
        ratings: {
          bullet: this.parseRating(stats.chess_bullet),
          blitz: this.parseRating(stats.chess_blitz),
          rapid: this.parseRating(stats.chess_rapid),
          daily: this.parseRating(stats.chess_daily),
        },
        stats: {
          totalGames: this.calculateTotalGames(stats),
          winRate: this.calculateWinRate(stats),
          bestRating: this.getBestRating(stats),
          joinDate: profile.joined ? new Date(profile.joined * 1000).toISOString() : undefined,
          lastOnline: profile.last_online ? new Date(profile.last_online * 1000).toISOString() : undefined,
          country: profile.country?.split('/').pop(),
        },
        lastUpdated: Date.now(),
      };

      this.cache.set(username.toLowerCase(), { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      return {
        username,
        ratings: {},
        stats: {},
        lastUpdated: Date.now(),
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      };
    }
  }

  private async fetchProfile(username: string): Promise<any> {
    const response = await fetch(`${API_BASE}/player/${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.status}`);
    }
    return response.json();
  }

  private async fetchStats(username: string): Promise<any> {
    const response = await fetch(`${API_BASE}/player/${encodeURIComponent(username)}/stats`);
    if (!response.ok) {
      throw new Error(`Stats fetch failed: ${response.status}`);
    }
    return response.json();
  }

  private parseRating(data: any): RatingInfo | undefined {
    if (!data || !data.last) return undefined;

    return {
      current: data.last.rating,
      best: data.best?.rating || data.last.rating,
      record: {
        win: data.record?.win || 0,
        loss: data.record?.loss || 0,
        draw: data.record?.draw || 0,
      },
      last: {
        rating: data.last.rating,
        date: data.last.end_time ? data.last.end_time * 1000 : Date.now(),
      },
    };
  }

  private calculateTotalGames(stats: any): number {
    let total = 0;
    const categories = ['chess_bullet', 'chess_blitz', 'chess_rapid', 'chess_daily'];
    for (const cat of categories) {
      if (stats[cat]?.record) {
        total += (stats[cat].record.win || 0) +
                 (stats[cat].record.loss || 0) +
                 (stats[cat].record.draw || 0);
      }
    }
    return total;
  }

  private calculateWinRate(stats: any): number {
    let wins = 0, total = 0;
    const categories = ['chess_bullet', 'chess_blitz', 'chess_rapid'];
    for (const cat of categories) {
      if (stats[cat]?.record) {
        wins += stats[cat].record.win || 0;
        total += (stats[cat].record.win || 0) +
                 (stats[cat].record.loss || 0) +
                 (stats[cat].record.draw || 0);
      }
    }
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  private getBestRating(stats: any): number {
    let best = 0;
    const categories = ['chess_bullet', 'chess_blitz', 'chess_rapid', 'chess_daily'];
    for (const cat of categories) {
      if (stats[cat]?.best?.rating) {
        best = Math.max(best, stats[cat].best.rating);
      }
    }
    return best;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
