import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
    moves?: string[];
    currentIndex?: number;
    onMoveClick?: (index: number) => void;
    currentComment?: string;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
    moves = [],
    currentIndex = -1,
    onMoveClick,
    currentComment
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to highlight
    useEffect(() => {
        if (!scrollRef.current) return;
        const active = scrollRef.current.querySelector<HTMLElement>('.move-active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentIndex, moves.length]);

    // Build move pairs: [[w, b], [w, b?], ...]
    const pairs: { num: number; w: { text: string; idx: number }; b: { text: string; idx: number } | null }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            num: Math.floor(i / 2) + 1,
            w: { text: moves[i], idx: i },
            b: moves[i + 1] ? { text: moves[i + 1], idx: i + 1 } : null,
        });
    }

    if (moves.length === 0) {
        return (
            <div className="flex items-center justify-center h-full py-16 px-6">
                <p className="text-[10px] text-white/15 font-bold uppercase tracking-[0.3em] text-center leading-relaxed">
                    Posición inicial.<br />Mueve una pieza para comenzar.
                </p>
            </div>
        );
    }

    return (
        <div ref={scrollRef} className="p-2">
            {/* 
                Lichess move list: compact inline pairs
                1. e4 e5  2. Nf3 Nc6 ...
                Active move highlighted, comment shown inline below the pair that contains it.
            */}
            <div className="flex flex-wrap gap-x-0 gap-y-0">
                {pairs.map(pair => {
                    const wActive = currentIndex === pair.w.idx;
                    const bActive = pair.b && currentIndex === pair.b.idx;
                    const pairIsActive = wActive || bActive;
                    const showComment = pairIsActive && currentComment;

                    return (
                        <React.Fragment key={pair.num}>
                            {/* Move number */}
                            <span className="inline-flex items-center px-1 py-1 text-[11px] text-white/25 font-mono select-none min-w-[2rem] justify-end">
                                {pair.num}.
                            </span>

                            {/* White move */}
                            <button
                                onClick={() => onMoveClick?.(pair.w.idx)}
                                className={`inline-flex items-center px-2 py-1 rounded text-[13px] font-medium transition-all ${wActive
                                        ? 'bg-[#b5b5af] text-black move-active font-bold'
                                        : 'text-[#c9c9c9] hover:bg-white/10'
                                    }`}
                            >
                                {pair.w.text}
                            </button>

                            {/* Black move */}
                            {pair.b ? (
                                <button
                                    onClick={() => onMoveClick?.(pair.b!.idx)}
                                    className={`inline-flex items-center px-2 py-1 rounded text-[13px] font-medium transition-all ${bActive
                                            ? 'bg-[#b5b5af] text-black move-active font-bold'
                                            : 'text-[#c9c9c9] hover:bg-white/10'
                                        }`}
                                >
                                    {pair.b.text}
                                </button>
                            ) : (
                                /* Filler so flex doesn't break oddly on last half-move */
                                <span className="inline-flex px-2 py-1 min-w-[3rem]" />
                            )}

                            {/* Inline comment — shown right after the pair that contains the active move */}
                            {showComment && (
                                <div className="w-full px-3 py-2 my-1 text-[11px] text-[#d4c68f] italic bg-white/[0.04] rounded border-l-2 border-gold/40">
                                    {currentComment}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default MoveHistory;
