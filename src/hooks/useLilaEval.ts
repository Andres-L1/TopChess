import { useState, useCallback, useRef, useEffect } from 'react';

interface LilaResult {
    fen: string;
    depth: number;
    knodes: number;
    score: number; // centipawns
    mate: number | null;
    bestMove: string;
    pvs: any[];
}

export const useLilaEval = () => {
    const [result, setResult] = useState<LilaResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const analyze = useCallback(async (fen: string) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setError(null);

        try {
            const encodedFen = encodeURIComponent(fen);
            const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}`, {
                signal: abortControllerRef.current.signal
            });

            if (response.status === 404) {
                // No cloud eval available for this position
                setResult(null);
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Lichess API error');
            }

            const data = await response.json();

            // Format Lila response to our EngineResult format
            const mainPv = data.pvs?.[0];
            const formattedResult: LilaResult = {
                fen: data.fen,
                depth: data.depth,
                knodes: data.knodes,
                score: mainPv?.cp ?? 0,
                mate: mainPv?.mate ?? null,
                bestMove: mainPv?.moves?.split(' ')[0] || '',
                pvs: data.pvs || []
            };

            setResult(formattedResult);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Lila Error:', err);
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
    }, []);

    return { result, isLoading, error, analyze, stop };
};
