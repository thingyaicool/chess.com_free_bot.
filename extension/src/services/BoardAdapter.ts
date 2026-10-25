/**
 * BoardAdapter - Interfaces with chess.com's DOM to read board state and execute moves.
 * Uses MutationObserver for reactive position tracking.
 */

import { Chess } from 'chess.js';
import type { GameState } from '../types';

export class BoardAdapter {
  private chess: Chess;
  private observer: MutationObserver | null = null;
  private onPositionChange: ((state: GameState) => void) | null = null;
  private onGameOver: ((result: { winner: 'white' | 'black' | 'draw' | null }) => void) | null = null;
  private lastFen: string = '';
  private isObserving = false;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Start observing the chess.com board for position changes.
   */
  startObserving(): void {
    if (this.isObserving) return;

    // Wait for the board to be present
    const waitForBoard = () => {
      const board = this.findBoardElement();
      if (board) {
        this.attachObserver(board);
        this.syncPosition();
      } else {
        setTimeout(waitForBoard, 1000);
      }
    };

    waitForBoard();
    this.isObserving = true;
  }

  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
  }

  private findBoardElement(): Element | null {
    // chess.com uses various selectors for the board
    const selectors = [
      'wc-chess-board',
      '.board',
      '#game-board',
      'chess-board',
      '[class*="board"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  private attachObserver(boardElement: Element): void {
    this.observer = new MutationObserver(() => {
      this.syncPosition();
    });

    this.observer.observe(boardElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also observe the move list for game state changes
    const moveList = document.querySelector('.move-list, .moves, [class*="move-list"]');
    if (moveList) {
      this.observer.observe(moveList, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Sync the current position from the chess.com DOM.
   */
  syncPosition(): void {
    const fen = this.readPositionFromDOM();
    if (!fen || fen === this.lastFen) return;

    this.lastFen = fen;

    try {
      this.chess.load(fen);
    } catch {
      // Invalid FEN, skip
      return;
    }

    const state = this.getCurrentState();
    this.onPositionChange?.(state);

    // Check for game over
    if (this.chess.isGameOver()) {
      let winner: 'white' | 'black' | 'draw' | null = null;
      if (this.chess.isCheckmate()) {
        winner = this.chess.turn() === 'w' ? 'black' : 'white';
      } else {
        winner = 'draw';
      }
      this.onGameOver?.({ winner });
    }
  }

  /**
   * Read the current board position from chess.com's DOM.
   */
  readPositionFromDOM(): string | null {
    // Method 1: Try to read from square elements
    const squares = document.querySelectorAll('[class*="square"]');
    if (squares.length >= 64) {
      return this.parseSquaresToFEN(squares);
    }

    // Method 2: Try to read from piece elements
    const pieces = document.querySelectorAll('[class*="piece"]');
    if (pieces.length > 0) {
      return this.parsePiecesToFEN(pieces);
    }

    // Method 3: Try to extract from the page's internal state
    const stateScript = document.querySelector('script[data-config]');
    if (stateScript) {
      try {
        const config = JSON.parse(stateScript.textContent || '');
        if (config.fen) return config.fen;
      } catch {
        // Ignore parse errors
      }
    }

    return null;
  }

  private parseSquaresToFEN(squares: NodeListOf<Element>): string | null {
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    squares.forEach((square) => {
      const classes = square.className.split(' ');
      const squareName = classes.find(c => /^[a-h][1-8]$/.test(c));
      if (!squareName) return;

      const file = squareName.charCodeAt(0) - 97; // a=0, h=7
      const rank = parseInt(squareName[1]) - 1; // 1=0, 8=7

      // Look for piece within this square
      const piece = square.querySelector('[class*="piece"]');
      if (piece) {
        const pieceClasses = piece.className.split(' ');
        const pieceType = this.extractPieceType(pieceClasses);
        const pieceColor = this.extractPieceColor(pieceClasses);
        if (pieceType && pieceColor) {
          const pieceChar = pieceColor === 'white' ? pieceType.toUpperCase() : pieceType.toLowerCase();
          board[7 - rank][file] = pieceChar;
        }
      }
    });

    return this.boardToFEN(board);
  }

  private parsePiecesToFEN(pieces: NodeListOf<Element>): string | null {
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    pieces.forEach((piece) => {
      const classes = piece.className.split(' ');
      const squareClass = classes.find(c => /^[a-h][1-8]$/.test(c));
      if (!squareClass) return;

      const file = squareClass.charCodeAt(0) - 97;
      const rank = parseInt(squareClass[1]) - 1;

      const pieceType = this.extractPieceType(classes);
      const pieceColor = this.extractPieceColor(classes);
      if (pieceType && pieceColor) {
        const pieceChar = pieceColor === 'white' ? pieceType.toUpperCase() : pieceType.toLowerCase();
        board[7 - rank][file] = pieceChar;
      }
    });

    return this.boardToFEN(board);
  }

  private extractPieceType(classes: string[]): string | null {
    const pieceMap: Record<string, string> = {
      'pawn': 'p', 'knight': 'n', 'bishop': 'b',
      'rook': 'r', 'queen': 'q', 'king': 'k',
    };
    for (const cls of classes) {
      if (pieceMap[cls]) return pieceMap[cls];
    }
    return null;
  }

  private extractPieceColor(classes: string[]): 'white' | 'black' | null {
    for (const cls of classes) {
      if (cls === 'white' || cls === 'light') return 'white';
      if (cls === 'black' || cls === 'dark') return 'black';
    }
    return null;
  }

  private boardToFEN(board: (string | null)[][]): string {
    const rows: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
      let row = '';
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        if (board[rank][file]) {
          if (empty > 0) { row += empty; empty = 0; }
          row += board[rank][file];
        } else {
          empty++;
        }
      }
      if (empty > 0) row += empty;
      rows.push(row);
    }

    // Determine turn from DOM or default to white
    const turn = this.detectTurn();
    return `${rows.join('/')} ${turn} - - 0 1`;
  }

  private detectTurn(): 'w' | 'b' {
    // Try to detect whose turn it is from the UI
    const clockElements = document.querySelectorAll('[class*="clock"]');
    // The active clock usually has a specific class
    for (const clock of clockElements) {
      if (clock.className.includes('active') || clock.className.includes('turn')) {
        if (clock.className.includes('top') || clock.className.includes('black')) return 'b';
        if (clock.className.includes('bottom') || clock.className.includes('white')) return 'w';
      }
    }
    return 'w'; // Default
  }

  /**
   * Execute a move on the chess.com board.
   */
  async executeMove(move: string): Promise<boolean> {
    try {
      // Convert UCI move to coordinates
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promotion = move.length > 4 ? move[4] : null;

      // Find and interact with the board squares
      const fromSquare = this.findSquareElement(from);
      const toSquare = this.findSquareElement(to);

      if (!fromSquare || !toSquare) {
        console.error('[BoardAdapter] Could not find square elements');
        return false;
      }

      // Simulate click on source square
      this.simulateClick(fromSquare);
      await this.delay(100);

      // Simulate click on target square
      this.simulateClick(toSquare);
      await this.delay(100);

      // Handle promotion if needed
      if (promotion) {
        await this.handlePromotion(promotion);
      }

      return true;
    } catch (error) {
      console.error('[BoardAdapter] Move execution failed:', error);
      return false;
    }
  }

  private findSquareElement(square: string): Element | null {
    // Try various selectors for finding a square
    const selectors = [
      `[class*="${square}"]`,
      `square-${square}`,
      `[data-square="${square}"]`,
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    // Fallback: find by position
    const allSquares = document.querySelectorAll('[class*="square"]');
    for (const sq of allSquares) {
      if (sq.className.includes(square)) return sq;
    }

    return null;
  }

  private simulateClick(element: Element): void {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const events = ['mousedown', 'mouseup', 'click'];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
      });
      element.dispatchEvent(event);
    }
  }

  private async handlePromotion(piece: string): Promise<void> {
    await this.delay(200);
    // Find promotion dialog
    const promotionDialog = document.querySelector('[class*="promotion"]');
    if (!promotionDialog) return;

    const pieceMap: Record<string, string> = {
      'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight',
    };

    const targetPiece = pieceMap[piece] || 'queen';
    const pieceButton = promotionDialog.querySelector(`[class*="${targetPiece}"]`);
    if (pieceButton) {
      this.simulateClick(pieceButton);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentState(): GameState {
    const history = this.chess.history();
    const fen = this.chess.fen();

    return {
      fen,
      moveHistory: history,
      isWhiteTurn: this.chess.turn() === 'w',
      gamePhase: this.detectGamePhase(history.length),
      isGameOver: this.chess.isGameOver(),
      result: this.getGameResult(),
      opponentUsername: this.detectOpponent(),
    };
  }

  private detectGamePhase(moveCount: number): 'opening' | 'middlegame' | 'endgame' {
    if (moveCount < 10) return 'opening';
    if (moveCount > 30) return 'endgame';
    return 'middlegame';
  }

  private getGameResult(): 'white' | 'black' | 'draw' | undefined {
    if (!this.chess.isGameOver()) return undefined;
    if (this.chess.isDraw()) return 'draw';
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black' : 'white';
    }
    return undefined;
  }

  detectOpponent(): string | undefined {
    // Try to find opponent username from chess.com's UI
    const selectors = [
      '.player-bottom .username',
      '.player-top .username',
      '[class*="player-name"]',
      '.user-username',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        return el.textContent.trim();
      }
    }

    // Try URL-based detection
    const urlMatch = window.location.href.match(/game\/([^/]+)/);
    return urlMatch ? urlMatch[1] : undefined;
  }

  getChessInstance(): Chess {
    return this.chess;
  }

  setPositionChangeCallback(callback: (state: GameState) => void): void {
    this.onPositionChange = callback;
  }

  setGameOverCallback(callback: (result: { winner: 'white' | 'black' | 'draw' | null }) => void): void {
    this.onGameOver = callback;
  }

  /**
   * Get all legal moves for the current position.
   */
  getLegalMoves(): string[] {
    return this.chess.moves();
  }

  /**
   * Check if a move is legal.
   */
  isLegalMove(move: string): boolean {
    try {
      const moves = this.chess.moves();
      return moves.some(m => {
        // Compare UCI notation
        const moveObj = this.chess.move(m);
        return moveObj && (moveObj.from + moveObj.to + (moveObj.promotion || '')) === move;
      });
    } catch {
      return false;
    }
  }
}
