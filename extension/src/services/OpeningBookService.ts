/**
 * OpeningBookService - Provides opening recommendations from a built-in opening book.
 * Uses a curated set of common openings with FEN-based lookup.
 */

import { Chess } from 'chess.js';
import type { OpeningBookEntry, OpeningMove } from '../types';

// Built-in opening book with common positions
// In production, this would be loaded from a larger polyglot-format book file
const OPENING_BOOK: Record<string, OpeningBookEntry> = {
  // Starting position
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
    openingName: 'Starting Position',
    moves: [
      { san: 'e4', uci: 'e2e4', games: 500000, score: 54, isMainLine: true },
      { san: 'd4', uci: 'd2d4', games: 400000, score: 56, isMainLine: true },
      { san: 'Nf3', uci: 'g1f3', games: 150000, score: 55, isMainLine: false },
      { san: 'c4', uci: 'c2c4', games: 100000, score: 56, isMainLine: false },
    ],
  },
  // After 1.e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -': {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -',
    openingName: "King's Pawn Opening",
    moves: [
      { san: 'e5', uci: 'e7e5', games: 300000, score: 48, isMainLine: true },
      { san: 'c5', uci: 'c7c5', games: 200000, score: 49, isMainLine: true },
      { san: 'e6', uci: 'e7e6', games: 100000, score: 47, isMainLine: false },
      { san: 'c6', uci: 'c7c6', games: 80000, score: 48, isMainLine: false },
      { san: 'd6', uci: 'd7d6', games: 30000, score: 45, isMainLine: false },
    ],
  },
  // After 1.e4 e5
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': {
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -',
    openingName: 'Open Game',
    moves: [
      { san: 'Nf3', uci: 'g1f3', games: 400000, score: 55, isMainLine: true },
      { san: 'Bc4', uci: 'f1c4', games: 80000, score: 52, isMainLine: false },
      { san: 'Nc3', uci: 'b1c3', games: 50000, score: 53, isMainLine: false },
    ],
  },
  // After 1.e4 e5 2.Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -': {
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -',
    openingName: "King's Knight Opening",
    moves: [
      { san: 'Nc6', uci: 'b8c6', games: 350000, score: 48, isMainLine: true },
      { san: 'Nf6', uci: 'g8f6', games: 80000, score: 46, isMainLine: false },
    ],
  },
  // After 1.d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -': {
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -',
    openingName: "Queen's Pawn Opening",
    moves: [
      { san: 'Nf6', uci: 'g8f6', games: 250000, score: 47, isMainLine: true },
      { san: 'd5', uci: 'd7d5', games: 200000, score: 46, isMainLine: true },
      { san: 'e6', uci: 'e7e6', games: 80000, score: 45, isMainLine: false },
      { san: 'f5', uci: 'f7f5', games: 30000, score: 43, isMainLine: false },
    ],
  },
  // Sicilian Defense
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': {
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -',
    openingName: 'Sicilian Defense',
    moves: [
      { san: 'Nf3', uci: 'g1f3', games: 300000, score: 54, isMainLine: true },
      { san: 'Nc3', uci: 'b1c3', games: 100000, score: 53, isMainLine: false },
      { san: 'd4', uci: 'd2d4', games: 80000, score: 55, isMainLine: false },
      { san: 'c3', uci: 'c2c3', games: 50000, score: 52, isMainLine: false },
    ],
  },
  // After 1.d4 d5
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': {
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -',
    openingName: 'Closed Game',
    moves: [
      { san: 'c4', uci: 'c2c4', games: 300000, score: 55, isMainLine: true },
      { san: 'Nf3', uci: 'g1f3', games: 80000, score: 53, isMainLine: false },
      { san: 'Bf4', uci: 'c1f4', games: 50000, score: 52, isMainLine: false },
    ],
  },
  // Queen's Gambit
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -': {
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -',
    openingName: "Queen's Gambit",
    moves: [
      { san: 'e6', uci: 'e7e6', games: 200000, score: 46, isMainLine: true },
      { san: 'c6', uci: 'c7c6', games: 100000, score: 45, isMainLine: true },
      { san: 'dxc4', uci: 'd5c4', games: 50000, score: 44, isMainLine: false },
    ],
  },
  // Italian Game position
  'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq -': {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq -',
    openingName: 'Italian Game',
    moves: [
      { san: 'Bc5', uci: 'f8c5', games: 200000, score: 47, isMainLine: true },
      { san: 'Nf6', uci: 'g8f6', games: 100000, score: 46, isMainLine: false },
    ],
  },
  // Ruy Lopez
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq -': {
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq -',
    openingName: 'Ruy Lopez',
    moves: [
      { san: 'a6', uci: 'a7a6', games: 250000, score: 47, isMainLine: true },
      { san: 'Nf6', uci: 'g8f6', games: 50000, score: 45, isMainLine: false },
    ],
  },
};

export class OpeningBookService {
  private book: Record<string, OpeningBookEntry>;
  private enabled = true;
  private maxMoves = 10;

  constructor() {
    this.book = OPENING_BOOK;
  }

  /**
   * Get opening recommendation for the current position.
   */
  getRecommendation(chess: Chess, moveNumber: number): OpeningBookEntry | null {
    if (!this.enabled) return null;
    if (moveNumber > this.maxMoves) return null;

    // Normalize FEN for lookup (remove move counters for matching)
    const fen = this.normalizeFEN(chess.fen());
    const entry = this.book[fen];

    if (!entry || entry.moves.length === 0) return null;

    return entry;
  }

  /**
   * Get alternative moves from the opening book.
   */
  getAlternatives(chess: Chess, count: number): OpeningMove[] {
    const fen = this.normalizeFEN(chess.fen());
    const entry = this.book[fen];

    if (!entry) return [];

    return entry.moves.slice(0, count);
  }

  /**
   * Check if the current position is in the opening book.
   */
  isInBook(chess: Chess): boolean {
    const fen = this.normalizeFEN(chess.fen());
    return fen in this.book;
  }

  /**
   * Get the opening name for the current position.
   */
  getOpeningName(chess: Chess): string | null {
    const fen = this.normalizeFEN(chess.fen());
    const entry = this.book[fen];
    return entry?.openingName || null;
  }

  /**
   * Normalize FEN for book lookup (remove half-move and full-move counters).
   */
  private normalizeFEN(fen: string): string {
    const parts = fen.split(' ');
    // Keep position, turn, and castling rights; normalize en passant and counters
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} - -`;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setMaxMoves(maxMoves: number): void {
    this.maxMoves = maxMoves;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
