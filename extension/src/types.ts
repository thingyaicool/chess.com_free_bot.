// Core type definitions for the Chess Training Assistant extension

export interface EngineConfig {
  depth: number;
  multiPV: number;
  elo: number | null; // null = max strength
  limitStrength: boolean;
  threads: number;
  hash: number; // MB
  moveTime: number | null; // ms, null = use depth
}

export interface EngineResult {
  bestMove: string;
  ponder: string | null;
  evaluation: number; // centipawns, positive = white advantage
  mateDistance: number | null; // null if no forced mate, positive = mating side
  depth: number;
  selDepth: number;
  nodes: number;
  time: number; // ms
  nps: number;
  pv: string[]; // principal variation moves
  multiPV: MultiPVLine[];
}

export interface MultiPVLine {
  rank: number;
  move: string;
  evaluation: number;
  mateDistance: number | null;
  pv: string[];
}

export interface CandidateMove {
  move: string;
  evaluation: number;
  mateDistance: number | null;
  rank: number;
  pv: string[];
}

export interface HangingPiece {
  square: string;
  piece: string; // e.g., 'wB', 'bN'
  pieceType: string; // 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'
  color: 'white' | 'black';
  value: number; // material value in centipawns
  attackers: AttackInfo[];
  defenders: AttackInfo[];
  isHanging: boolean;
  isTacticallyDefended: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface AttackInfo {
  square: string;
  piece: string;
  pieceType: string;
  value: number;
}

export interface OpponentStats {
  username: string;
  avatar?: string;
  title?: string;
  ratings: {
    bullet?: RatingInfo;
    blitz?: RatingInfo;
    rapid?: RatingInfo;
    daily?: RatingInfo;
  };
  stats: {
    totalGames?: number;
    winRate?: number;
    bestRating?: number;
    joinDate?: string;
    lastOnline?: string;
    country?: string;
  };
  lastUpdated: number;
  error?: string;
}

export interface RatingInfo {
  current: number;
  best: number;
  record: { win: number; loss: number; draw: number };
  last?: { rating: number; date: number };
}

export interface OpeningBookEntry {
  fen: string;
  moves: OpeningMove[];
  openingName?: string;
}

export interface OpeningMove {
  san: string;
  uci: string;
  games?: number;
  score?: number;
  isMainLine: boolean;
}

export interface TimingConfig {
  minMoveTime: number; // seconds
  maxMoveTime: number; // seconds
  variation: number; // percentage, 0-100
  complexityAdjustment: boolean;
  additionalDelay: number; // seconds
}

export interface RandomizationConfig {
  enabled: boolean;
  categories: {
    opening: boolean;
    timing: boolean;
    delay: boolean;
    moves: boolean;
    accuracy: boolean;
  };
  accuracy: {
    target: number; // percentage, e.g., 80
    tolerance: number; // ±percentage points
    strength: number; // 0-100
  };
  timing: {
    variation: number; // percentage
  };
  delay: {
    variation: number; // percentage
  };
  moves: {
    topN: number;
    weighted: boolean;
  };
  opening: {
    alternatives: number;
  };
  seed: string | null; // null = random
  preset: 'consistent' | 'balanced' | 'variable' | 'custom';
}

export interface AutoPlayConfig {
  enabled: boolean;
  side: 'white' | 'black' | 'both';
  status: 'idle' | 'analyzing' | 'ready' | 'waiting' | 'paused' | 'error';
  candidateTopN: number;
  selectionMode: 'deterministic' | 'weighted';
}

export interface AutoNextGameConfig {
  enabled: boolean;
  delay: number; // seconds
  maxGames: number | null; // null = unlimited
  maxDuration: number | null; // minutes, null = unlimited
  pauseOnError: boolean;
  requireConfirmation: boolean;
}

export interface ExtensionSettings {
  engine: EngineConfig;
  timing: TimingConfig;
  randomization: RandomizationConfig;
  autoPlay: AutoPlayConfig;
  autoNextGame: AutoNextGameConfig;
  ui: {
    showEvalBar: boolean;
    showHangingPieces: boolean;
    showOpponentStats: boolean;
    showOpeningBook: boolean;
    showAnalysisPanel: boolean;
    evalBarOrientation: 'vertical' | 'horizontal';
    theme: 'dark' | 'light';
  };
  hangingPieceDetection: {
    enabled: boolean;
    showAttacked: boolean;
    showUndefended: boolean;
    showTactical: boolean;
    highlightColor: string;
  };
  openingBook: {
    enabled: boolean;
    maxMoves: number;
    showAlternatives: boolean;
  };
}

export type MessageType =
  | 'ANALYZE'
  | 'ENGINE_RESULT'
  | 'ENGINE_READY'
  | 'ENGINE_ERROR'
  | 'POSITION_UPDATE'
  | 'MOVE_REQUEST'
  | 'MOVE_EXECUTED'
  | 'GAME_STATE_CHANGE'
  | 'SETTINGS_UPDATE'
  | 'GET_OPPONENT_STATS'
  | 'OPPONENT_STATS_RESULT'
  | 'CANCEL_ANALYSIS'
  | 'ENGINE_STATUS';

export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
}

export interface GameState {
  fen: string;
  moveHistory: string[];
  isWhiteTurn: boolean;
  gamePhase: 'opening' | 'middlegame' | 'endgame';
  isGameOver: boolean;
  result?: 'white' | 'black' | 'draw';
  opponentUsername?: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  engine: {
    depth: 15,
    multiPV: 3,
    elo: null,
    limitStrength: false,
    threads: 1,
    hash: 64,
    moveTime: null,
  },
  timing: {
    minMoveTime: 1.0,
    maxMoveTime: 6.0,
    variation: 20,
    complexityAdjustment: true,
    additionalDelay: 0.5,
  },
  randomization: {
    enabled: false,
    categories: {
      opening: true,
      timing: true,
      delay: true,
      moves: true,
      accuracy: false,
    },
    accuracy: {
      target: 80,
      tolerance: 5,
      strength: 50,
    },
    timing: {
      variation: 15,
    },
    delay: {
      variation: 20,
    },
    moves: {
      topN: 3,
      weighted: true,
    },
    opening: {
      alternatives: 3,
    },
    seed: null,
    preset: 'balanced',
  },
  autoPlay: {
    enabled: false,
    side: 'both',
    status: 'idle',
    candidateTopN: 1,
    selectionMode: 'deterministic',
  },
  autoNextGame: {
    enabled: false,
    delay: 3,
    maxGames: null,
    maxDuration: null,
    pauseOnError: true,
    requireConfirmation: false,
  },
  ui: {
    showEvalBar: true,
    showHangingPieces: true,
    showOpponentStats: true,
    showOpeningBook: true,
    showAnalysisPanel: true,
    evalBarOrientation: 'vertical',
    theme: 'dark',
  },
  hangingPieceDetection: {
    enabled: true,
    showAttacked: true,
    showUndefended: true,
    showTactical: true,
    highlightColor: '#f59e0b',
  },
  openingBook: {
    enabled: true,
    maxMoves: 10,
    showAlternatives: true,
  },
};

export const PIECE_VALUES: Record<string, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

export const ELO_PRESETS = [400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];
