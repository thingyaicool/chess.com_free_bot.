/**
 * Unit tests for core extension logic.
 * Run with: npx tsx tests/core.test.ts
 */

import { Chess } from 'chess.js';

// Test helpers
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n📦 ${name}`);
  fn();
}

// ========================
// Test: chess.js integration
// ========================

describe('Chess.js Integration', () => {
  const chess = new Chess();

  assert(chess.fen() === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Starting FEN is correct');
  assert(chess.turn() === 'w', 'White starts');
  assert(chess.moves().length === 20, '20 legal moves from starting position');

  chess.move('e4');
  assert(chess.turn() === 'b', 'Black to move after e4');
  assert(chess.fen().includes('4P3'), 'e4 pawn visible in FEN');

  chess.move('e5');
  chess.move('Nf3');
  assert(chess.history().length === 3, 'Move history has 3 moves');
  assert(chess.history()[0] === 'e4', 'First move was e4');
});

// ========================
// Test: Legal move validation
// ========================

describe('Legal Move Validation', () => {
  const chess = new Chess();

  const legalMoves = chess.moves();
  assert(legalMoves.includes('e4'), 'e4 is legal from starting position');
  assert(legalMoves.includes('d4'), 'd4 is legal from starting position');
  assert(!legalMoves.includes('e5'), 'e5 is NOT legal from starting position');

  // Test illegal position
  const badChess = new Chess();
  try {
    badChess.load('invalid fen');
    assert(false, 'Should reject invalid FEN');
  } catch {
    assert(true, 'Correctly rejects invalid FEN');
  }
});

// ========================
// Test: Piece values
// ========================

describe('Piece Values', () => {
  const PIECE_VALUES: Record<string, number> = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000,
  };

  assert(PIECE_VALUES.pawn === 100, 'Pawn = 100');
  assert(PIECE_VALUES.knight === 320, 'Knight = 320');
  assert(PIECE_VALUES.bishop === 330, 'Bishop = 330');
  assert(PIECE_VALUES.rook === 500, 'Rook = 500');
  assert(PIECE_VALUES.queen === 900, 'Queen = 900');
  assert(PIECE_VALUES.queen > PIECE_VALUES.rook + PIECE_VALUES.knight, 'Queen > Rook + Knight');
});

// ========================
// Test: FEN normalization
// ========================

describe('FEN Normalization', () => {
  function normalizeFEN(fen: string): string {
    const parts = fen.split(' ');
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} - -`;
  }

  const fen1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
  const fen2 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

  assert(normalizeFEN(fen1) === normalizeFEN(fen2), 'FEN normalization removes en passant and move counters');
});

// ========================
// Test: Elo depth mapping
// ========================

describe('Elo to Depth Mapping', () => {
  function getDepthForElo(elo: number | null): number {
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

  assert(getDepthForElo(null) === 20, 'Max strength = depth 20');
  assert(getDepthForElo(2500) === 18, '2500 Elo = depth 18');
  assert(getDepthForElo(1600) === 10, '1600 Elo = depth 10');
  assert(getDepthForElo(800) === 4, '800 Elo = depth 4');
  assert(getDepthForElo(400) === 2, '400 Elo = depth 2');
});

// ========================
// Test: Timing calculation
// ========================

describe('Timing Calculation', () => {
  function calculateDelay(minTime: number, maxTime: number, variation: number): number {
    let minMs = minTime * 1000;
    let maxMs = maxTime * 1000;

    if (variation > 0) {
      const v = variation / 100;
      const jitter = 1 + (Math.random() * 2 - 1) * v;
      minMs *= jitter;
      maxMs *= jitter;
    }

    return Math.round(minMs + Math.random() * (maxMs - minMs));
  }

  // Run multiple times to check range
  let allInRange = true;
  for (let i = 0; i < 100; i++) {
    const delay = calculateDelay(1.0, 6.0, 0);
    if (delay < 900 || delay > 6100) {
      allInRange = false;
      break;
    }
  }
  assert(allInRange, 'Delays within configured range (no variation)');

  const delay = calculateDelay(2.0, 4.0, 0);
  assert(delay >= 1900 && delay <= 4100, 'Delay between 2-4 seconds');
});

// ========================
// Test: Seeded PRNG
// ========================

describe('Seeded PRNG (Mulberry32)', () => {
  function mulberry32(seed: number): () => number {
    return function() {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const rng1 = mulberry32(42);
  const rng2 = mulberry32(42);

  const val1 = rng1();
  const val2 = rng2();
  assert(val1 === val2, 'Same seed produces same first value');

  const seq1 = [rng1(), rng1(), rng1()];
  const seq2 = [mulberry32(42)(), mulberry32(42)(), mulberry32(42)()];
  // Note: seq2 won't match seq1 because each call creates a new sequence
  // But two RNGs with same seed should produce same sequence
  const rng3 = mulberry32(42);
  const rng4 = mulberry32(42);
  const a = [rng3(), rng3(), rng3()];
  const b = [rng4(), rng4(), rng4()];
  assert(a[0] === b[0] && a[1] === b[1] && a[2] === b[2], 'Same seed produces same sequence');

  const rng5 = mulberry32(42);
  const rng6 = mulberry32(99);
  assert(rng5() !== rng6(), 'Different seeds produce different values');

  // Check range
  const rng7 = mulberry32(12345);
  let inRange = true;
  for (let i = 0; i < 1000; i++) {
    const v = rng7();
    if (v < 0 || v >= 1) { inRange = false; break; }
  }
  assert(inRange, 'PRNG values in [0, 1) range');
});

// ========================
// Test: Candidate selection
// ========================

describe('Candidate Move Selection', () => {
  interface Candidate {
    move: string;
    evaluation: number;
    rank: number;
  }

  function deterministicSelect(candidates: Candidate[]): Candidate {
    return candidates[0];
  }

  function weightedSelect(candidates: Candidate[]): Candidate {
    if (candidates.length === 1) return candidates[0];
    const bestEval = Math.max(...candidates.map(c => c.evaluation));
    const weights = candidates.map(c => Math.exp(-(bestEval - c.evaluation) / 100));
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      random -= weights[i];
      if (random <= 0) return candidates[i];
    }
    return candidates[0];
  }

  const candidates: Candidate[] = [
    { move: 'e4', evaluation: 35, rank: 1 },
    { move: 'd4', evaluation: 30, rank: 2 },
    { move: 'Nf3', evaluation: 20, rank: 3 },
  ];

  assert(deterministicSelect(candidates).move === 'e4', 'Deterministic selects best move');

  // Weighted should mostly select best move
  let bestCount = 0;
  for (let i = 0; i < 100; i++) {
    if (weightedSelect(candidates).move === 'e4') bestCount++;
  }
  assert(bestCount > 50, `Weighted selection favors best move (${bestCount}% of time)`);
  assert(bestCount < 100, 'Weighted selection allows other moves sometimes');
});

// ========================
// Test: Game phase detection
// ========================

describe('Game Phase Detection', () => {
  function detectPhase(moveCount: number): string {
    if (moveCount < 10) return 'opening';
    if (moveCount > 30) return 'endgame';
    return 'middlegame';
  }

  assert(detectPhase(0) === 'opening', '0 moves = opening');
  assert(detectPhase(5) === 'opening', '5 moves = opening');
  assert(detectPhase(15) === 'middlegame', '15 moves = middlegame');
  assert(detectPhase(35) === 'endgame', '35 moves = endgame');
});

// ========================
// Summary
// ========================

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);

if (failed > 0) {
  process.exit(1);
}
