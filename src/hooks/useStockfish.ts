import { useState, useEffect, useRef, useCallback } from 'react';

export interface EngineResult {
    depth: number;
    score: number; // in centipawns
    mate: number | null;
    bestMove: string | null;
    pv: string[]; // principal variation
}

export const useStockfish = () => {
    const [engineStatus, setEngineStatus] = useState<'loading' | 'ready' | 'error' | 'off'>('off');
    const [result, setResult] = useState<EngineResult | null>(null);
    const workerRef = useRef<Worker | null>(null);

    const stop = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.postMessage('stop');
            workerRef.current.postMessage('quit');
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setEngineStatus('off');
        setResult(null);
    }, []);

    const start = useCallback(() => {
        if (workerRef.current) return;

        setEngineStatus('loading');
        try {
            // Using a reliable Stockfish WASM worker from CDN for maximum compatibility
            const worker = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

            worker.onmessage = (e) => {
                const line = e.data;
                console.log('Stockfish:', line);

                if (line === 'uciok') {
                    setEngineStatus('ready');
                    worker.postMessage('isready');
                }

                if (line.startsWith('info depth')) {
                    const depth = parseInt(line.split('depth ')[1]);
                    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
                    const pvMatch = line.match(/pv (.+)/);

                    if (scoreMatch) {
                        const type = scoreMatch[1];
                        const val = parseInt(scoreMatch[2]);

                        setResult(prev => ({
                            depth,
                            score: type === 'cp' ? val : (val > 0 ? 10000 : -10000),
                            mate: type === 'mate' ? val : null,
                            bestMove: prev?.bestMove || null,
                            pv: pvMatch ? pvMatch[1].split(' ') : (prev?.pv || [])
                        }));
                    }
                }

                if (line.startsWith('bestmove')) {
                    const bestMove = line.split(' ')[1];
                    setResult(prev => prev ? { ...prev, bestMove } : null);
                }
            };

            worker.postMessage('uci');
            workerRef.current = worker;
        } catch (err) {
            console.error('Failed to start Stockfish worker:', err);
            setEngineStatus('error');
        }
    }, []);

    const analyze = useCallback((fen: string) => {
        if (workerRef.current && engineStatus === 'ready') {
            workerRef.current.postMessage('stop');
            workerRef.current.postMessage(`position fen ${fen}`);
            workerRef.current.postMessage('go depth 15');
        }
    }, [engineStatus]);

    useEffect(() => {
        return () => stop();
    }, [stop]);

    return { engineStatus, result, start, stop, analyze };
};
