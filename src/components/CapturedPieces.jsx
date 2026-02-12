import React, { useMemo } from 'react';

const CapturedPieces = ({ fen, orientation = 'white' }) => {
    const captured = useMemo(() => {
        const pieces = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
        const starting = { p: 8, n: 2, b: 2, r: 2, q: 1 };

        // Count pieces on board
        const boardPart = fen.split(' ')[0];
        for (const char of boardPart) {
            if (['P', 'N', 'B', 'R', 'Q'].includes(char)) pieces.w[char.toLowerCase()]++;
            else if (['p', 'n', 'b', 'r', 'q'].includes(char)) pieces.b[char]++;
        }

        // Calculate missing (captured) pieces
        const capturedW = [];
        const capturedB = [];

        ['p', 'n', 'b', 'r', 'q'].forEach(p => {
            const countW = pieces.w[p];
            const countB = pieces.b[p];

            for (let i = 0; i < starting[p] - countW; i++) capturedW.push(p); // White pieces lost (held by Black)
            for (let i = 0; i < starting[p] - countB; i++) capturedB.push(p); // Black pieces lost (held by White)
        });

        // Calculate material score
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        const scoreW = Object.keys(pieces.w).reduce((acc, p) => acc + (pieces.w[p] * values[p]), 0);
        const scoreB = Object.keys(pieces.b).reduce((acc, p) => acc + (pieces.b[p] * values[p]), 0);

        return {
            w: capturedW, // White pieces that are captured (gone)
            b: capturedB, // Black pieces that are captured (gone)
            score: scoreW - scoreB
        };
    }, [fen]);

    // Render pieces helper
    const renderPieces = (pieces, colorClass) => (
        <div className="flex -space-x-1 h-4 items-center">
            {pieces.map((p, i) => (
                <span key={i} className={`text-base leading-none ${colorClass} drop-shadow-sm`}>
                    {p === 'p' ? '♟' : p === 'n' ? '♞' : p === 'b' ? '♝' : p === 'r' ? '♜' : '♛'}
                </span>
            ))}
        </div>
    );

    const topPlayerIsBlack = orientation === 'white';

    return (
        <div className="flex justify-between items-center w-full px-2 py-1 text-xs font-bold bg-black/20 rounded-lg border border-white/5">
            {/* Top Player Captured (Pieces LOST by Top, held by Bottom? No, usually show what 'Top' has CAPTURED)
               Standard: Show pieces captured BY the player.
               If Top is Black: Show White pieces captured by Black.
            */}

            <div className="flex items-center gap-2">
                {renderPieces(captured.w, 'text-text-secondary')}
                {captured.score < 0 && <span className="text-gold">+{Math.abs(captured.score)}</span>}
            </div>

            <div className="flex items-center gap-2">
                {captured.score > 0 && <span className="text-gold">+{captured.score}</span>}
                {renderPieces(captured.b, 'text-text-secondary')}
            </div>
        </div>
    );
};

export default CapturedPieces;
