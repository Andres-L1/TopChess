import React, { useEffect, useRef } from 'react';

const MoveHistory = ({ moves = [] }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [moves]);

    // Format moves into pairs
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            num: Math.floor(i / 2) + 1,
            white: moves[i],
            black: moves[i + 1] || ''
        });
    }

    return (
        <div className="flex flex-col h-full bg-dark-panel border border-white/5 rounded-xl overflow-hidden relative">
            <div className="bg-white/5 px-4 py-2 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-gold shadow-sm flex justify-between items-center">
                <span>Historial</span>
                {moves.length > 0 && <span className="text-xs text-text-muted">{Math.ceil(moves.length / 2)} moves</span>}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                    <tbody>
                        {pairs.map((pair, idx) => (
                            <tr key={idx} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/2'}`}>
                                <td className="py-2 pl-4 w-12 text-sm text-text-muted font-mono border-r border-white/5 bg-black/20">
                                    {pair.num}.
                                </td>
                                <td className="py-2 pl-3 text-sm font-bold text-white hover:text-gold cursor-pointer transition-colors w-1/2">
                                    {pair.white}
                                </td>
                                <td className="py-2 pl-3 text-sm font-bold text-white hover:text-gold cursor-pointer transition-colors w-1/2">
                                    {pair.black}
                                </td>
                            </tr>
                        ))}
                        {pairs.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-text-muted text-xs italic">
                                    Partida lista para comenzar...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MoveHistory;
