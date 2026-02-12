import React, { useEffect, useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessground as NativeChessground } from 'chessground';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { RotateCw, RotateCcw } from 'lucide-react';
import useChessSound from '../hooks/useChessSound';
import toast, { Toaster } from 'react-hot-toast';

const Board = ({ teacherId, onGameStateChange }) => {
    // Game Logic State
    const chessRef = useRef(new Chess());

    // We keep some state for UI reactivity
    const [fen, setFen] = useState(chessRef.current.fen());
    const [orientation, setOrientation] = useState("white");
    const [lastMove, setLastMove] = useState(null);
    const [pendingPromotion, setPendingPromotion] = useState(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [turn, setTurn] = useState('w');

    // Refs for Chessground
    const boardRef = useRef(null);
    const apiRef = useRef(null);
    const { userRole } = React.useContext(AuthContext);
    const { play } = useChessSound();

    // Helper: Calculate Dests
    const getDests = (inputChess) => {
        const d = new Map();
        const moves = inputChess.moves({ verbose: true });
        moves.forEach(m => {
            if (!d.has(m.from)) d.set(m.from, []);
            d.get(m.from).push(m.to);
        });
        return d;
    };

    // 1. Initialize Chessground (Native)
    useEffect(() => {
        if (!boardRef.current) return;

        const config = {
            fen: fen,
            orientation: orientation,
            viewOnly: false,
            turnColor: 'white',
            check: false,
            highlight: { lastMove: true, check: true },
            animation: { enabled: true, duration: 250 },
            movable: {
                free: false,
                color: 'white',
                dests: getDests(chessRef.current),
                showDests: true,
            },
            draggable: {
                enabled: true,
                showGhost: true,
            },
            selectable: { enabled: true },
            drawable: { enabled: true, visible: true },
            events: {
                move: (orig, dest) => handleUserMove(orig, dest)
            }
        };

        const api = NativeChessground(boardRef.current, config);
        apiRef.current = api;

        // Force resize
        const resizeObserver = new ResizeObserver(() => {
            if (apiRef.current) apiRef.current.redrawAll();
        });
        resizeObserver.observe(boardRef.current);

        return () => {
            api.destroy();
            resizeObserver.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Handle User Moves
    const handleUserMove = (orig, dest) => {
        const chess = chessRef.current;

        // Promotion check
        const piece = chess.get(orig);
        const isPromotion = piece && piece.type === 'p' &&
            ((piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1'));

        if (isPromotion) {
            setPendingPromotion({ from: orig, to: dest });
            return;
        }

        try {
            const move = chess.move({ from: orig, to: dest });
            if (move) {
                if (move.captured) play('capture');
                else if (move.flags.includes('c') || move.flags.includes('k')) play('castle'); // Castling check
                else play('move');

                if (chess.inCheck()) {
                    play('check');
                    toast("¡Jaque!", { icon: '⚠️', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                }

                updateGameState(chess, [orig, dest]);
            } else {
                snapback();
            }
        } catch (e) {
            console.log("Invalid move caught", e);
            snapback();
            toast.error("Movimiento inválido.");
        }
    };

    const snapback = () => {
        if (apiRef.current) {
            apiRef.current.set({ fen: chessRef.current.fen() });
        }
    };

    const updateGameState = (chessInstance, moveArr) => {
        const newFen = chessInstance.fen();
        const newTurn = chessInstance.turn() === 'w' ? 'white' : 'black';
        const history = chessInstance.history();
        const pgn = chessInstance.pgn();

        setFen(newFen);
        setLastMove(moveArr);
        setTurn(chessInstance.turn());

        const gameOver = chessInstance.isGameOver();
        setIsGameOver(gameOver);
        if (gameOver) setShowGameOverModal(true);

        // Notify parent context of state change
        if (onGameStateChange) {
            onGameStateChange({
                fen: newFen,
                history: history,
                turn: chessInstance.turn(),
                isGameOver: gameOver
            });
        }

        if (gameOver) {
            play('gameEnd');
            if (chessInstance.isCheckmate()) toast.success("¡Jaque Mate!", { duration: 5000, icon: '👑' });
            else if (chessInstance.isDraw()) toast("Tablas.", { icon: '🤝' });
        }

        if (apiRef.current) {
            apiRef.current.set({
                fen: newFen,
                turnColor: newTurn,
                check: chessInstance.inCheck(),
                lastMove: moveArr,
                movable: {
                    color: newTurn,
                    dests: getDests(chessInstance)
                }
            });
        }

        mockDB.updateRoom(teacherId, {
            fen: newFen,
            pgn: pgn, // Sync PGN for history restoration
            history: history, // Sync history array for easy UI access
            lastMove: moveArr,
            orientation: orientation
        });
    };

    // 3. Sync from DB
    useEffect(() => {
        const unsubscribe = mockDB.subscribeToRoom(teacherId, (data) => {
            if (data && data.fen) {
                const currentFen = chessRef.current.fen();

                // If remote FEN is different, we sync.
                // We prefer loading PGN if available to keep history.
                if (data.fen !== currentFen) {
                    try {
                        if (data.pgn) {
                            chessRef.current.loadPgn(data.pgn);
                        } else {
                            chessRef.current.load(data.fen);
                        }

                        setFen(data.fen);
                        setLastMove(data.lastMove);
                        setTurn(chessRef.current.turn());
                        setIsGameOver(chessRef.current.isGameOver());
                        if (data.orientation) setOrientation(data.orientation);

                        // Update parent UI state on sync too
                        if (onGameStateChange) {
                            onGameStateChange({
                                fen: data.fen,
                                history: data.history || chessRef.current.history(),
                                turn: chessRef.current.turn(),
                                isGameOver: chessRef.current.isGameOver()
                            });
                        }

                        if (apiRef.current) {
                            const side = chessRef.current.turn() === 'w' ? 'white' : 'black';
                            apiRef.current.set({
                                fen: data.fen,
                                lastMove: data.lastMove,
                                orientation: data.orientation || orientation,
                                turnColor: side,
                                check: chessRef.current.inCheck(),
                                movable: {
                                    color: side,
                                    dests: getDests(chessRef.current)
                                }
                            });

                            // Optional: Trigger sound on remote move detection if desired
                            // Avoid double sound if local user moved
                            // For now, let's play only if valid move detected and not local
                            // play('move'); 
                        }
                    } catch (e) {
                        console.error("Remote sync error", e);
                        // Fallback to FEN if PGN fails
                        try {
                            chessRef.current.load(data.fen);
                            setFen(data.fen);
                            if (apiRef.current) apiRef.current.set({ fen: data.fen });
                        } catch (err) {
                            console.error("Critical sync error", err);
                        }
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [teacherId, play, onGameStateChange]);

    const handlePromotionSelect = (type) => {
        if (!pendingPromotion) return;
        const chess = chessRef.current;
        try {
            const move = chess.move({
                from: pendingPromotion.from,
                to: pendingPromotion.to,
                promotion: type
            });
            if (move) {
                play('promote');
                updateGameState(chess, [pendingPromotion.from, pendingPromotion.to]);
            } else {
                snapback();
            }
        } catch (e) {
            snapback();
        }
        setPendingPromotion(null);
    };

    const toggleOrientation = () => {
        const newO = orientation === 'white' ? 'black' : 'white';
        setOrientation(newO);
        if (apiRef.current) apiRef.current.set({ orientation: newO });
        mockDB.updateRoom(teacherId, { orientation: newO });
    };

    const handleReset = () => {
        if (confirm("¿Reiniciar partida?")) {
            chessRef.current.reset();
            updateGameState(chessRef.current, null);
            toast("Tablero reiniciado", { icon: '🔄' });
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#1A1A1A',
                    color: '#EAEAEA',
                    border: '1px solid #333',
                }
            }} />

            {/* Floating Game Controls (Absolute relative to board container) */}
            <div className="absolute top-4 -right-16 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={toggleOrientation}
                    className="p-3 bg-dark-panel/90 text-white rounded-xl shadow-xl hover:scale-110 hover:bg-gold hover:text-black transition-all border border-white/10 backdrop-blur-sm tooltip-left"
                    title="Girar Tablero"
                >
                    <RotateCw size={18} />
                </button>
                {(userRole === 'teacher' || isGameOver) && (
                    <button
                        onClick={handleReset}
                        className="p-3 bg-dark-panel/90 text-red-500 rounded-xl shadow-xl hover:scale-110 hover:bg-red-500 hover:text-white transition-all border border-white/10 backdrop-blur-sm"
                        title="Reiniciar Partida"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
            </div>

            {/* Board Container with Gold Shadow */}
            <div className="w-full aspect-square relative shadow-2xl border-[4px] border-[#1a1a1a] rounded-sm bg-[#111] overflow-hidden">
                {/* Gold Glow behind board */}
                <div className="absolute -inset-1 bg-gradient-to-br from-gold/10 to-transparent opacity-20 blur-sm rounded-lg pointer-events-none"></div>

                <div ref={boardRef} className="w-full h-full relative z-10" />

                {/* Promotion Overlay */}
                {pendingPromotion && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                        <div className="bg-dark-panel p-4 rounded-xl border border-gold/30 flex gap-4 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                            {['q', 'r', 'b', 'n'].map(p => (
                                <button key={p} onClick={() => handlePromotionSelect(p)} className="w-14 h-14 bg-dark-bg hover:bg-gold/10 rounded-lg flex items-center justify-center text-4xl border border-white/10 hover:border-gold/50 transition-all hover:scale-105 active:scale-95 group">
                                    <span className={`drop-shadow-lg ${turn === 'w' ? 'text-white' : 'text-gray-400 group-hover:text-gold'}`}>
                                        {p === 'q' ? '♕' : p === 'r' ? '♖' : p === 'b' ? '♗' : '♘'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Game Over Overlay */}
                {showGameOverModal && (
                    <div className="absolute inset-0 z-40 bg-dark-bg/85 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
                        <div className="bg-dark-panel px-10 py-8 rounded-2xl border border-gold/20 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>

                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Partida Finalizada</h3>
                            <div className="text-gold font-bold text-xl uppercase tracking-[0.2em] mb-6 drop-shadow-sm">
                                {chessRef.current.isCheckmate() ? 'Jaque Mate' :
                                    chessRef.current.isDraw() ? 'Tablas' :
                                        chessRef.current.isStalemate() ? 'Ahogado' : 'Fin'}
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setShowGameOverModal(false)} className="px-6 py-3 bg-white/5 text-gray-300 border border-white/10 rounded-lg font-bold hover:bg-white/10 hover:text-white transition-all uppercase text-xs tracking-widest">
                                    Analizar
                                </button>
                                <button onClick={handleReset} className="px-6 py-3 bg-gold/10 text-gold border border-gold/30 rounded-lg font-bold hover:bg-gold hover:text-black transition-all uppercase text-xs tracking-widest shadow-lg hover:shadow-gold/20">
                                    Nueva Partida
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Board;
