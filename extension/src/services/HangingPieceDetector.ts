/**
 * HangingPieceDetector - Identifies vulnerable pieces using attack maps and engine evaluation.
 */

import { Chess, Square } from 'chess.js';
import type { HangingPiece, AttackInfo } from '../types';
import { PIECE_VALUES } from '../types';

export class HangingPieceDetector {
  /**
   * Detect hanging pieces for both colors.
   */
  detectHangingPieces(chess: Chess): HangingPiece[] {
    const hangingPieces: HangingPiece[] = [];
    const board = chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece || piece.type === 'k') continue; // Skip kings

        const square = this.fileRankToSquare(file, rank);
        const color = piece.color === 'w' ? 'white' : 'black';
        const enemyColor = piece.color === 'w' ? 'b' : 'w';

        const attackers = this.getAttackers(chess, square, enemyColor);
        const defenders = this.getAttackers(chess, square, piece.color);

        if (attackers.length === 0) continue;

        const pieceValue = PIECE_VALUES[piece.type] || 0;
        const isHanging = this.isPieceHanging(piece, attackers, defenders, chess);
        const isTacticallyDefended = this.isTacticallyDefended(piece, attackers, defenders, chess);

        if (isHanging || (attackers.length > 0 && defenders.length === 0)) {
          const threatLevel = this.calculateThreatLevel(piece, attackers, defenders, isHanging);
          const description = this.generateDescription(piece, square, attackers, defenders, isHanging, isTacticallyDefended);

          hangingPieces.push({
            square,
            piece: `${piece.color}${piece.type.toUpperCase()}`,
            pieceType: piece.type,
            color,
            value: pieceValue,
            attackers: attackers.map(a => ({
              square: a.square,
              piece: `${a.color}${a.type.toUpperCase()}`,
              pieceType: a.type,
              value: PIECE_VALUES[a.type] || 0,
            })),
            defenders: defenders.map(d => ({
              square: d.square,
              piece: `${d.color}${d.type.toUpperCase()}`,
              pieceType: d.type,
              value: PIECE_VALUES[d.type] || 0,
            })),
            isHanging,
            isTacticallyDefended,
            threatLevel,
            description,
          });
        }
      }
    }

    return hangingPieces;
  }

  /**
   * Get all pieces attacking a given square.
   */
  private getAttackers(chess: Chess, square: Square, byColor: 'w' | 'b'): { square: Square; type: string; color: string }[] {
    const attackers: { square: Square; type: string; color: string }[] = [];
    const board = chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece || piece.color !== byColor) continue;

        const attackerSquare = this.fileRankToSquare(file, rank);

        if (this.canPieceAttackSquare(chess, piece, attackerSquare, square)) {
          attackers.push({
            square: attackerSquare,
            type: piece.type,
            color: piece.color,
          });
        }
      }
    }

    return attackers;
  }

  /**
   * Check if a piece at a given square can attack a target square.
   */
  private canPieceAttackSquare(
    chess: Chess,
    piece: { type: string; color: string },
    from: Square,
    to: Square
  ): boolean {
    // Use chess.js to check if the piece can move to the target square
    // We create a temporary position to check attacks
    const testChess = new Chess(chess.fen());

    try {
      const moves = testChess.moves({ square: from, verbose: true });
      return moves.some(m => m.to === to);
    } catch {
      return false;
    }
  }

  /**
   * Determine if a piece is truly hanging (can be captured for free or with favorable trade).
   */
  private isPieceHanging(
    piece: { type: string; color: string },
    attackers: { type: string }[],
    defenders: { type: string }[],
    chess: Chess
  ): boolean {
    const pieceValue = PIECE_VALUES[piece.type] || 0;

    // If no attackers, not hanging
    if (attackers.length === 0) return false;

    // If undefended, definitely hanging
    if (defenders.length === 0) return true;

    // Check if any attacker is of lower or equal value (favorable capture)
    const cheapestAttacker = Math.min(...attackers.map(a => PIECE_VALUES[a.type] || 0));
    if (cheapestAttacker <= pieceValue) return true;

    // Check defender values
    const totalDefenderValue = defenders.reduce((sum, d) => sum + (PIECE_VALUES[d.type] || 0), 0);
    if (totalDefenderValue < pieceValue) return true;

    return false;
  }

  /**
   * Check if a piece is tactically defended (e.g., defending it would create a bigger threat).
   */
  private isTacticallyDefended(
    piece: { type: string; color: string },
    attackers: { type: string }[],
    defenders: { type: string }[],
    chess: Chess
  ): boolean {
    if (defenders.length === 0) return false;

    // Check if capturing would expose the attacker to a worse fate
    const pieceValue = PIECE_VALUES[piece.type] || 0;

    for (const attacker of attackers) {
      const attackerValue = PIECE_VALUES[attacker.type] || 0;

      // If the attacker is much more valuable, capturing might not be good
      if (attackerValue > pieceValue * 2) {
        // Check if there's a defender that can recapture
        if (defenders.some(d => (PIECE_VALUES[d.type] || 0) <= attackerValue)) {
          return true; // Tactically defended - capturing loses material
        }
      }
    }

    return false;
  }

  private calculateThreatLevel(
    piece: { type: string },
    attackers: { type: string }[],
    defenders: { type: string }[],
    isHanging: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!isHanging) return 'low';

    const pieceValue = PIECE_VALUES[piece.type] || 0;

    // King in danger
    if (piece.type === 'k') return 'critical';

    // Queen hanging
    if (piece.type === 'q') return 'critical';

    // Multiple attackers, no defenders
    if (attackers.length >= 2 && defenders.length === 0) return 'critical';

    // High-value piece with low-value attacker
    if (pieceValue >= 500 && attackers.some(a => (PIECE_VALUES[a.type] || 0) < pieceValue)) {
      return 'high';
    }

    // Single attacker, no defender
    if (defenders.length === 0) return 'high';

    return 'medium';
  }

  private generateDescription(
    piece: { type: string; color: string },
    square: string,
    attackers: { square: string; type: string }[],
    defenders: { square: string; type: string }[],
    isHanging: boolean,
    isTacticallyDefended: boolean
  ): string {
    const colorName = piece.color === 'w' ? 'White' : 'Black';
    const pieceName = piece.type.charAt(0).toUpperCase() + piece.type.slice(1);
    const attackerNames = attackers.map(a => a.type).join(', ');
    const defenderNames = defenders.map(d => d.type).join(', ');

    if (isHanging && defenders.length === 0) {
      return `${colorName} ${pieceName} on ${square}: hanging! Attacked by ${attackerNames} with no defenders.`;
    }

    if (isTacticallyDefended) {
      return `${colorName} ${pieceName} on ${square}: attacked by ${attackerNames} but tactically defended by ${defenderNames}.`;
    }

    if (isHanging) {
      return `${colorName} ${pieceName} on ${square}: insufficiently defended. Attacked by ${attackerNames}, defended by ${defenderNames}.`;
    }

    return `${colorName} ${pieceName} on ${square}: under pressure from ${attackerNames}.`;
  }

  private fileRankToSquare(file: number, rank: number): Square {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}` as Square;
  }
}
