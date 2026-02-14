import React, { useMemo } from 'react';

const CapturedPieces = ({ fen, orientation = 'white' }) => {
    const captured = useMemo(() => {
        const pieces = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
        const starting = { p: 8, n: 2, b: 2, r: 2, q: 1 };

        if (!fen || fen === 'start') fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        // Count pieces on board
        const boardPart = fen.split(' ')[0];
        for (const char of boardPart) {
            if (['P', 'N', 'B', 'R', 'Q'].includes(char)) pieces.w[char.toLowerCase()]++;
            else if (['p', 'n', 'b', 'r', 'q'].includes(char)) pieces.b[char]++;
        }

        // Pieces lost by White (held by Black)
        const lostW = [];
        // Pieces lost by Black (held by White)
        const lostB = [];

        ['p', 'n', 'b', 'r', 'q'].forEach(p => {
            for (let i = 0; i < starting[p] - pieces.w[p]; i++) lostW.push(p);
            for (let i = 0; i < starting[p] - pieces.b[p]; i++) lostB.push(p);
        });

        const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        const scoreW = Object.keys(pieces.w).reduce((acc, p) => acc + (pieces.w[p] * values[p]), 0);
        const scoreB = Object.keys(pieces.b).reduce((acc, p) => acc + (pieces.b[p] * values[p]), 0);

        return { lostW, lostB, diff: scoreW - scoreB };
    }, [fen]);

    const renderSet = (pieces, colorClass) => (
        <div className="flex -space-x-1.5 items-center">
            {pieces.length > 0 ? pieces.map((p, i) => (
                <span key={i} className={`text-xl leading-none ${colorClass} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>
                    {p === 'p' ? '♟' : p === 'n' ? '♞' : p === 'b' ? '♝' : p === 'r' ? '♜' : '♛'}
                </span>
            )) : <span className="text-[9px] text-white/5 uppercase tracking-widest font-black">Limpio</span>}
        </div>
    );

    return (
        <div className="space-y-3 bg-[#161512] p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Capturadas Blancas</span>
                <div className="flex items-center gap-3">
                    {renderSet(captured.lostW, 'text-gray-400')}
                    {captured.diff < 0 && <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">+{Math.abs(captured.diff)}</span>}
                </div>
            </div>
            <div className="h-[1px] bg-white/5"></div>
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Capturadas Negras</span>
                <div className="flex items-center gap-3">
                    {renderSet(captured.lostB, 'text-white')}
                    {captured.diff > 0 && <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">+{captured.diff}</span>}
                </div>
            </div>
        </div>
    );
};

export default CapturedPieces;
