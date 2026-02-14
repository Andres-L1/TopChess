import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
    moves?: string[];
    currentIndex?: number;
    onMoveClick?: (index: number) => void;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves = [], currentIndex = -1, onMoveClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current && (currentIndex === -1 || currentIndex === moves.length - 1)) {
            const activeElem = scrollRef.current.querySelector('.move-active');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [moves, currentIndex]);

    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            num: Math.floor(i / 2) + 1,
            white: { text: moves[i], index: i },
            black: moves[i + 1] ? { text: moves[i + 1], index: i + 1 } : null
        });
    }

    return (
        <div className="flex flex-col h-full bg-[#161512] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
            <div className="bg-[#1b1a17] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Historial de Jugadas</span>
                </div>
                {moves.length > 0 && (
                    <span className="text-[9px] text-white/30 font-mono font-bold px-2 py-0.5 bg-white/5 rounded">
                        {Math.ceil(moves.length / 2)} {Math.ceil(moves.length / 2) === 1 ? 'RONDA' : 'RONDAS'}
                    </span>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-[#12110f]">
                <div className="flex flex-wrap p-2 gap-y-1">
                    {pairs.map((pair, idx) => (
                        <div key={idx} className="flex items-center w-full hover:bg-white/[0.02] rounded transition-colors group">
                            {/* Move Number */}
                            <div className="w-10 text-[10px] text-white/20 font-mono font-bold text-center pr-2 border-r border-white/5 py-1">
                                {pair.num}.
                            </div>

                            {/* White Move */}
                            <div
                                onClick={() => onMoveClick?.(pair.white.index)}
                                className={`flex-1 px-4 py-2 text-sm font-bold cursor-pointer transition-all truncate
                                    ${currentIndex === pair.white.index
                                        ? 'bg-gold text-black move-active shadow-lg rounded-sm scale-[1.02] z-10'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                {pair.white.text}
                            </div>

                            {/* Black Move */}
                            <div
                                onClick={() => pair.black && onMoveClick?.(pair.black.index)}
                                className={`flex-1 px-4 py-2 text-sm font-bold cursor-pointer transition-all truncate
                                    ${pair.black && currentIndex === pair.black.index
                                        ? 'bg-gold text-black move-active shadow-lg rounded-sm scale-[1.02] z-10'
                                        : pair.black ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-transparent pointer-events-none'}
                                `}
                            >
                                {pair.black?.text || '...'}
                            </div>
                        </div>
                    ))}

                    {moves.length === 0 && (
                        <div className="w-full text-center py-20 px-8">
                            <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] italic leading-relaxed">
                                El tablero está en su posición inicial.<br />Mueve una pieza para comenzar.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Navigation Footer (Optional style) */}
            <div className="h-1 bg-white/5 w-full">
                <div
                    className="h-full bg-gold transition-all duration-300"
                    style={{ width: `${moves.length > 0 ? ((currentIndex + 1) / moves.length) * 100 : 0}%` }}
                ></div>
            </div>
        </div>
    );
};

export default MoveHistory;
