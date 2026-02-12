import React from 'react';
import { Crown, AlertTriangle, Shield, Sword, XCircle, ArrowUpCircle } from 'lucide-react';

const ChessRules = () => {
    const rules = [
        {
            piece: 'Rey (King)',
            icon: '♔',
            value: '∞',
            desc: 'La pieza más importante. Mueve una casilla en cualquier dirección. No puede ser capturado, pero el juego termina si no puede escapar de un ataque (Jaque Mate).',
            lucide: Crown
        },
        {
            piece: 'Dama (Queen)',
            icon: '♕',
            value: '9',
            desc: 'La pieza más poderosa. Combina los movimientos de la torre y el alfil: mueve cualquier número de casillas en vertical, horizontal o diagonal.',
            lucide: Sword
        },
        {
            piece: 'Torre (Rook)',
            icon: '♖',
            value: '5',
            desc: 'Mueve en línea recta horizontal o verticalmente. Participa en el enroque junto con el rey.',
            lucide: Shield
        },
        {
            piece: 'Alfil (Bishop)',
            icon: '♗',
            value: '3',
            desc: 'Mueve en diagonal cualquier número de casillas. Un alfil siempre permanece en casillas del mismo color durante toda la partida.',
            lucide: XCircle
        },
        {
            piece: 'Caballo (Knight)',
            icon: '♘',
            value: '3',
            desc: 'Mueve en forma de "L" (dos casillas en una dirección, luego una en perpendicular). Es la única pieza que puede saltar sobre otras.',
            lucide: ArrowUpCircle
        },
        {
            piece: 'Peón (Pawn)',
            icon: '♙',
            value: '1',
            desc: 'Mueve hacia adelante. Una casilla por turno (o dos desde su casilla inicial). Captura en diagonal. Al llegar al final, promociona.',
            lucide: AlertTriangle
        }
    ];

    const specialMoves = [
        { name: 'Enroque (Castling)', desc: 'Movimiento defensivo especial del Rey y una Torre. El Rey mueve dos casillas hacia la Torre, y la Torre salta al otro lado del Rey.' },
        { name: 'Al Paso (En Passant)', desc: 'Captura especial de peón que ocurre inmediatamente después de que un peón contrario mueva dos casillas desde su origen.' },
        { name: 'Promoción', desc: 'Cuando un peón alcanza la última fila, se transforma inmediatamente en Dama, Torre, Alfil o Caballo.' }
    ];

    return (
        <div className="flex-grow overflow-y-auto p-4 space-y-8 custom-scrollbar bg-dark-bg/50">
            <section>
                <h3 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gold/20 pb-2">
                    <Crown size={14} /> Piezas y Valor
                </h3>
                <div className="space-y-3">
                    {rules.map((r, i) => (
                        <div key={i} className="bg-dark-panel p-3 rounded-lg border border-white/5 hover:border-gold/30 transition-all group hover:shadow-lg hover:shadow-gold/5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl text-white drop-shadow-md group-hover:scale-110 transition-transform">{r.icon}</span>
                                    <span className="font-bold text-sm text-text-primary group-hover:text-gold transition-colors">{r.piece}</span>
                                </div>
                                <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 font-bold uppercase tracking-wider">{r.value} PTS</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed font-light">{r.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gold/20 pb-2">
                    <Shield size={14} /> Movimientos Especiales
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {specialMoves.map((m, i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="block text-xs font-bold text-text-primary mb-1">{m.name}</span>
                            <span className="block text-[10px] text-text-muted leading-snug">{m.desc}</span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="text-center p-4 opacity-50">
                <p className="text-[9px] text-text-muted uppercase tracking-widest">Reglas FIDE Estándar</p>
            </div>
        </div>
    );
};

export default ChessRules;
