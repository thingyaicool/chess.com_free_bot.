/**
 * EngineManager - Manages Stockfish WebAssembly engine lifecycle and communication.
 * Runs Stockfish in a Web Worker for non-blocking analysis.
 * Supports configurable depth, think time, and human-like timing.
 */

import type { EngineConfig, EngineResult, MultiPVLine, CandidateMove } from '../types';

export class EngineManager {
  private worker: Worker | null = null;
  private isReady = false;
  private isAnalyzing = false;
  private currentAnalysisId = 0;
  private resultBuffer: string[] = [];
  private config: EngineConfig;
  private onResultCallback: ((result: EngineResult) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onReadyCallback: (() => void) | null = null;
  private onProgressCallback: ((depth: number, eval: number, pv: string[]) => void) | null = null;

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      depth: 15,
      thinkTime: 3,
      multiPV: 3,
      elo: null,
      limitStrength: false,
      threads: 1,
      hash: 64,
      moveTime: null,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker from the bundled Stockfish engine
        let engineUrl: string;
        try {
          engineUrl = chrome.runtime.getURL('engine/stockfish.js');
        } catch {
          // Fallback for testing outside extension context
          engineUrl = './engine/stockfish.js';
        }

        this.worker = new Worker(engineUrl);

        this.worker.onmessage = (e: MessageEvent) => {
          this.handleEngineMessage(typeof e.data === 'string' ? e.data : String(e.data));
        };

        this.worker.onerror = (e) => {
          console.error('[EngineManager] Worker error:', e);
          this.onErrorCallback?.(`Engine error: ${e.message || 'Unknown error'}`);
          reject(new Error(`Failed to initialize engine: ${e.message || 'Unknown'}`));
        };

        // Initialize UCI protocol
        this.sendCommand('uci');

        // Set a timeout for initialization
        const timeout = setTimeout(() => {
          reject(new Error('Engine initialization timeout (10s)'));
        }, 10000);

        const origHandler = this.onReadyCallback;
        this.onReadyCallback = () => {
          clearTimeout(timeout);
          this.isReady = true;
          this.configureEngine();
          origHandler?.();
          resolve();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleEngineMessage(line: string): void {
    if (!line) return;

    if (line === 'uciok') {
      this.onReadyCallback?.();
      return;
    }

    if (line === 'readyok') {
      this.isReady = true;
      this.onReadyCallback?.();
      return;
    }

    if (this.isAnalyzing) {
      this.resultBuffer.push(line);

      // Report progress for info lines
      if (line.startsWith('info') && line.includes('depth')) {
        const tokens = line.split(' ');
        const depth = parseInt(this.getTokenValue(tokens, 'depth') || '0');
        const pvIdx = tokens.indexOf('pv');
        const pv = pvIdx !== -1 ? tokens.slice(pvIdx + 1) : [];

        let eval = 0;
        const scoreIdx = tokens.indexOf('score');
        if (scoreIdx !== -1 && tokens[scoreIdx + 1] === 'cp') {
          eval = parseInt(tokens[scoreIdx + 2] || '0');
        }

        this.onProgressCallback?.(depth, eval, pv);
      }

      if (line.startsWith('bestmove')) {
        this.isAnalyzing = false;
        const result = this.parseAnalysisResult(this.resultBuffer, line);
        this.resultBuffer = [];
        if (result && this.onResultCallback) {
          this.onResultCallback(result);
        }
      }
    }
  }

  private parseAnalysisResult(buffer: string[], bestMoveLine: string): EngineResult | null {
    const parts = bestMoveLine.split(' ');
    const bestMove = parts[1] || '';
    const ponder = parts[3] || null;

    let evaluation = 0;
    let mateDistance: number | null = null;
    let depth = 0;
    let selDepth = 0;
    let nodes = 0;
    let time = 0;
    let nps = 0;
    const pv: string[] = [];
    const multiPV: MultiPVLine[] = [];
    const pvMap = new Map<number, { eval: number; mate: number | null; pv: string[]; depth: number }>();

    for (const line of buffer) {
      if (!line.startsWith('info')) continue;

      const tokens = line.split(' ');
      const pvNum = parseInt(this.getTokenValue(tokens, 'multipv') || '1');
      const lineDepth = parseInt(this.getTokenValue(tokens, 'depth') || '0');
      const lineSelDepth = parseInt(this.getTokenValue(tokens, 'seldepth') || '0');
      const lineNodes = parseInt(this.getTokenValue(tokens, 'nodes') || '0');
      const lineTime = parseInt(this.getTokenValue(tokens, 'time') || '0');
      const lineNps = parseInt(this.getTokenValue(tokens, 'nps') || '0');

      // Parse score
      let lineEval = 0;
      let lineMate: number | null = null;
      const scoreIdx = tokens.indexOf('score');
      if (scoreIdx !== -1) {
        if (tokens[scoreIdx + 1] === 'cp') {
          lineEval = parseInt(tokens[scoreIdx + 2] || '0');
        } else if (tokens[scoreIdx + 1] === 'mate') {
          lineMate = parseInt(tokens[scoreIdx + 2] || '0');
          lineEval = lineMate > 0 ? 10000 - lineMate : -10000 - lineMate;
        }
      }

      // Parse PV
      const pvIdx = tokens.indexOf('pv');
      const linePV = pvIdx !== -1 ? tokens.slice(pvIdx + 1) : [];

      if (linePV.length > 0) {
        // Only keep the deepest analysis for each PV line
        const existing = pvMap.get(pvNum);
        if (!existing || lineDepth >= existing.depth) {
          pvMap.set(pvNum, {
            eval: lineEval,
            mate: lineMate,
            pv: linePV,
            depth: lineDepth,
          });
        }
      }

      // Update overall stats from PV1 (or no multipv)
      if (pvNum === 1) {
        evaluation = lineEval;
        mateDistance = lineMate;
        depth = lineDepth;
        selDepth = lineSelDepth;
        nodes = lineNodes;
        time = lineTime;
        nps = lineNps;
        if (linePV.length > 0) {
          pv.length = 0;
          pv.push(...linePV);
        }
      }
    }

    // Build multiPV array from the map
    for (const [rank, data] of pvMap.entries()) {
      multiPV.push({
        rank,
        move: data.pv[0] || '',
        evaluation: data.eval,
        mateDistance: data.mate,
        pv: data.pv,
      });
    }

    // If no multiPV lines were parsed, create one from the main line
    if (multiPV.length === 0 && bestMove) {
      multiPV.push({
        rank: 1,
        move: bestMove,
        evaluation,
        mateDistance,
        pv,
      });
    }

    // Sort by rank
    multiPV.sort((a, b) => a.rank - b.rank);

    return {
      bestMove,
      ponder,
      evaluation,
      mateDistance,
      depth,
      selDepth,
      nodes,
      time,
      nps,
      pv,
      multiPV,
    };
  }

  private getTokenValue(tokens: string[], key: string): string | null {
    const idx = tokens.indexOf(key);
    return idx !== -1 && idx + 1 < tokens.length ? tokens[idx + 1] : null;
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  private configureEngine(): void {
    this.sendCommand(`setoption name MultiPV value ${this.config.multiPV}`);
    this.sendCommand(`setoption name Threads value ${this.config.threads}`);
    this.sendCommand(`setoption name Hash value ${this.config.hash}`);

    if (this.config.limitStrength && this.config.elo !== null) {
      this.sendCommand('setoption name UCI_LimitStrength value true');
      // Clamp to Stockfish's supported Elo range (1320-3190)
      const clampedElo = Math.max(1320, Math.min(3190, this.config.elo));
      this.sendCommand(`setoption name UCI_Elo value ${clampedElo}`);
    } else {
      this.sendCommand('setoption name UCI_LimitStrength value false');
    }

    // Human-like behavior: add slight randomness to evaluation
    // This makes the engine's choices less predictable
    this.sendCommand('setoption name Skill Level value 20'); // Max skill
  }

  /**
   * Analyze a position with configurable depth or think time.
   * Adds human-like timing variation to avoid detection.
   */
  analyze(fen: string, options?: { depth?: number; thinkTime?: number; useThinkTime?: boolean }): void {
    if (!this.isReady || !this.worker) {
      throw new Error('Engine not ready');
    }

    // Cancel any ongoing analysis
    if (this.isAnalyzing) {
      this.sendCommand('stop');
    }

    this.currentAnalysisId++;
    this.isAnalyzing = true;
    this.resultBuffer = [];

    const depth = options?.depth || this.config.depth;
    const thinkTime = options?.thinkTime || this.config.thinkTime;
    const useThinkTime = options?.useThinkTime ?? (this.config.moveTime !== null || thinkTime > 0);

    // Add human-like timing variation (±15-30% random variation)
    const humanVariation = 1 + (Math.random() * 0.3 - 0.15); // 0.85 to 1.15
    const actualThinkTime = Math.round(thinkTime * 1000 * humanVariation);

    this.sendCommand('ucinewgame');
    this.sendCommand(`position fen ${fen}`);

    if (useThinkTime && actualThinkTime > 0) {
      this.sendCommand(`go movetime ${actualThinkTime}`);
    } else {
      this.sendCommand(`go depth ${depth}`);
    }
  }

  cancelAnalysis(): void {
    if (this.isAnalyzing) {
      this.sendCommand('stop');
      this.isAnalyzing = false;
      this.resultBuffer = [];
    }
  }

  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.isReady) {
      this.configureEngine();
    }
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  onResult(callback: (result: EngineResult) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  onReady(callback: () => void): void {
    this.onReadyCallback = callback;
  }

  onProgress(callback: (depth: number, eval: number, pv: string[]) => void): void {
    this.onProgressCallback = callback;
  }

  getStatus(): { ready: boolean; analyzing: boolean } {
    return { ready: this.isReady, analyzing: this.isAnalyzing };
  }

  destroy(): void {
    this.cancelAnalysis();
    if (this.worker) {
      this.sendCommand('quit');
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }

  /**
   * Get candidate moves from the latest analysis result.
   */
  getCandidates(result: EngineResult, topN: number): CandidateMove[] {
    return result.multiPV
      .slice(0, topN)
      .map((line, idx) => ({
        move: line.move,
        evaluation: line.evaluation,
        mateDistance: line.mateDistance,
        rank: idx + 1,
        pv: line.pv,
      }));
  }
}
