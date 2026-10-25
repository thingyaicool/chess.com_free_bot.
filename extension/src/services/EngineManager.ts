/**
 * EngineManager - Manages Stockfish WebAssembly engine lifecycle and communication.
 * Runs Stockfish in a Web Worker for non-blocking analysis.
 */

import type { EngineConfig, EngineResult, MultiPVLine, CandidateMove } from './types';

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

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      depth: 15,
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
        const engineUrl = chrome.runtime.getURL('engine/stockfish.js');
        this.worker = new Worker(engineUrl);

        this.worker.onmessage = (e: MessageEvent) => {
          this.handleEngineMessage(e.data);
        };

        this.worker.onerror = (e) => {
          console.error('[EngineManager] Worker error:', e);
          this.onErrorCallback?.(`Engine error: ${e.message}`);
          reject(new Error(`Failed to initialize engine: ${e.message}`));
        };

        // Initialize UCI protocol
        this.sendCommand('uci');

        // Wait for uciok, then configure
        const readyHandler = () => {
          this.isReady = true;
          this.configureEngine();
          this.onReadyCallback?.();
          resolve();
        };

        // Set a timeout for initialization
        const timeout = setTimeout(() => {
          reject(new Error('Engine initialization timeout'));
        }, 10000);

        const origHandler = this.onReadyCallback;
        this.onReadyCallback = () => {
          clearTimeout(timeout);
          origHandler?.();
          readyHandler();
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

    for (const line of buffer) {
      if (!line.startsWith('info')) continue;

      const tokens = line.split(' ');
      const pvNum = this.getTokenValue(tokens, 'multipv');
      const lineDepth = parseInt(this.getTokenValue(tokens, 'depth') || '0');
      const lineSelDepth = parseInt(this.getTokenValue(tokens, 'seldepth') || '0');
      const lineNodes = parseInt(this.getTokenValue(tokens, 'nodes') || '0');
      const lineTime = parseInt(this.getTokenValue(tokens, 'time') || '0');
      const lineNps = parseInt(this.getTokenValue(tokens, 'nps') || '0');

      // Only process the latest depth for each PV line
      if (lineDepth < depth && pvNum <= 1) continue;

      // Parse score
      const scoreIdx = tokens.indexOf('score');
      if (scoreIdx !== -1) {
        if (tokens[scoreIdx + 1] === 'cp') {
          evaluation = parseInt(tokens[scoreIdx + 2] || '0');
          mateDistance = null;
        } else if (tokens[scoreIdx + 1] === 'mate') {
          mateDistance = parseInt(tokens[scoreIdx + 2] || '0');
          evaluation = mateDistance > 0 ? 10000 - mateDistance : -10000 - mateDistance;
        }
      }

      // Parse PV
      const pvIdx = tokens.indexOf('pv');
      if (pvIdx !== -1) {
        const linePV = tokens.slice(pvIdx + 1);
        if (pvNum === 1 || !pvNum) {
          pv.length = 0;
          pv.push(...linePV);
          depth = lineDepth;
          selDepth = lineSelDepth;
          nodes = lineNodes;
          time = lineTime;
          nps = lineNps;
        }

        if (pvNum) {
          multiPV.push({
            rank: pvNum,
            move: linePV[0] || '',
            evaluation: evaluation,
            mateDistance: mateDistance,
            pv: linePV,
          });
        }
      }
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
      multiPV: multiPV.sort((a, b) => a.rank - b.rank),
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
      this.sendCommand(`setoption name UCI_Elo value ${this.config.elo}`);
    } else {
      this.sendCommand('setoption name UCI_LimitStrength value false');
    }
  }

  analyze(fen: string, options?: { depth?: number; moveTime?: number }): void {
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
    const moveTime = options?.moveTime || this.config.moveTime;

    this.sendCommand('ucinewgame');
    this.sendCommand(`position fen ${fen}`);

    if (moveTime) {
      this.sendCommand(`go movetime ${moveTime}`);
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
