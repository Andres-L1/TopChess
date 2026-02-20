import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Chess, fen as chessopsFen, parseSquare, SquareName, Square, Move, makeSquare, san, charToRole } from 'chessops';
import { Chessground as NativeChessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { Key } from 'chessground/types';
import { DrawShape } from 'chessground/draw';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import '../styles/lichess.css';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import useChessSound from '../hooks/useChessSound';
import { lichessService } from '../services/lichessService';
import { useLilaEval } from '../hooks/useLilaEval';
import { useVibration } from '../hooks/useVibration';
import { RoomData, GameState } from '../types/index';
import EngineEval from './EngineEval';
import { Chess as ChessJS } from 'chess.js';

interface BoardProps {
    teacherId: string;
    onGameStateChange?: (state: GameState) => void;
    isAnalysisEnabled?: boolean;
    onAnalysisToggle?: (enabled: boolean) => void;
    chapterPgn?: string;
    roomData?: RoomData | null;
}

export interface BoardHandle {
    goToMove: (index: number) => void;
    reset: () => void;
    toggleOrientation: () => void;
}

const Board = forwardRef<BoardHandle, BoardProps>(({ teacherId, onGameStateChange, isAnalysisEnabled: externalAnalysisEnabled, chapterPgn, roomData }, ref) => {
    // Logic State (Chessops)
    const chessRef = useRef<Chess>(Chess.default());

    // UI reactivity
    const [fen, setFen] = useState(chessopsFen.makeFen(chessRef.current.toSetup()));
    const [orientation, setOrientation] = useState<"white" | "black">("white");
    const [lastMove, setLastMove] = useState<[Key, Key] | null>(null);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: Key; to: Key; color: string } | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [turn, setTurn] = useState<'w' | 'b'>('w');
    const [shapes, setShapes] = useState<DrawShape[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [fenHistory, setFenHistory] = useState<string[]>([chessopsFen.makeFen(Chess.default().toSetup())]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // Atomic refs to avoid stale closures during rapid moves
    const historyRef = useRef<string[]>([]);
    const fenHistoryRef = useRef<string[]>([chessopsFen.makeFen(Chess.default().toSetup())]);
    const currentIndexRef = useRef(-1);
    const [internalAnalysisEnabled] = useState(false);

    const isAnalysisActive = externalAnalysisEnabled !== undefined ? externalAnalysisEnabled : internalAnalysisEnabled;

    // Refs for Chessground
    const visualBoardRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Api | null>(null);
    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { userRole } = useAuth();
    const { play } = useChessSound();
    const { vibrate } = useVibration();

    // Lila (Lichess Cloud Eval) Hook
    const { result: lilaResult, isLoading: isLilaLoading, analyze, stop: stopLila } = useLilaEval();

    useImperativeHandle(ref, () => ({
        goToMove: (idx: number) => handleGoToMove(idx),
        reset: () => handleReset(),
        toggleOrientation: () => handleToggleOrientation()
    }));

    // Trigger analysis when FEN or Active state changes
    useEffect(() => {
        if (isAnalysisActive && fen && fen !== 'start') {
            analyze(fen);
        } else if (!isAnalysisActive) {
            stopLila();
        }
    }, [isAnalysisActive, fen, analyze, stopLila]);

    const getDests = (chess: Chess) => {
        const dests = new Map<Key, Key[]>();
        const allDests = chess.allDests();
        for (const [from, squareSet] of allDests) {
            const fromName = makeSquare(from) as Key;
            const toNames: Key[] = [];
            for (const to of squareSet) {
                toNames.push(makeSquare(to) as Key);
            }
            dests.set(fromName, toNames);
        }
        return dests;
    };

    const snapback = () => {
        apiRef.current?.set({ fen: chessopsFen.makeFen(chessRef.current.toSetup()) });
    };

    const handleUserMove = (orig: Key, dest: Key) => {
        const currentIdx = currentIndexRef.current;
        const currentHist = historyRef.current;
        const currentFenHist = fenHistoryRef.current;

        const isAtEnd = currentIdx === -1 || currentIdx === currentHist.length - 1;

        if (!isAtEnd && userRole !== 'teacher') {
            snapback();
            return;
        }

        const chess = chessRef.current;
        const from = parseSquare(orig as SquareName)!;
        const to = parseSquare(dest as SquareName)!;

        const piece = chess.board.get(from);
        const isPawn = piece?.role === 'pawn';
        const rank = Math.floor(to / 8);
        const isPromotionRank = (piece?.color === 'white' && rank === 7) || (piece?.color === 'black' && rank === 0);

        if (isPawn && isPromotionRank) {
            setPendingPromotion({ from: orig, to: dest, color: piece?.color || 'white' });
            return;
        }

        const move: Move = { from, to };
        const newPos = chess.clone();
        try {
            if (newPos.isLegal(move)) {
                const sanMove = san.makeSan(chess, move);
                newPos.play(move);
                const captured = chess.board.has(to);
                chessRef.current = newPos;
                if (captured) {
                    play('capture');
                    vibrate([10]); // Slight stronger for capture
                } else {
                    play('move');
                    vibrate(5); // Very subtle for move
                }

                // Truncate if moving from historical position, otherwise append
                const updatedHistory = isAtEnd ? [...currentHist, sanMove] : currentHist.slice(0, currentIdx + 1).concat(sanMove);
                const newFen = chessopsFen.makeFen(newPos.toSetup());
                const updatedFenHistory = isAtEnd ? [...currentFenHist, newFen] : currentFenHist.slice(0, currentIdx + 2).concat(newFen);

                const newIdx = updatedHistory.length - 1;

                // Update refs (immediate for next move logic)
                historyRef.current = updatedHistory;
                fenHistoryRef.current = updatedFenHistory;
                currentIndexRef.current = newIdx;

                // Update states (for UI)
                setHistory(updatedHistory);
                setFenHistory(updatedFenHistory);
                setCurrentIndex(newIdx);

                updateGameState(newPos, [orig, dest], updatedHistory, updatedFenHistory, newIdx);
            } else {
                snapback();
            }
        } catch (e) {
            snapback();
        }
    };

    useEffect(() => {
        if (!visualBoardRef.current) return;

        const config: Config = {
            fen: fen,
            orientation: orientation,
            turnColor: chessRef.current.turn === 'white' ? 'white' : 'black',
            check: chessRef.current.isCheck(),
            lastMove: lastMove || undefined,
            coordinates: true,
            movable: {
                free: false,
                color: userRole === 'teacher' ? 'both' : (orientation as 'white' | 'black'),
                dests: getDests(chessRef.current),
                showDests: true,
            },
            drawable: {
                enabled: true,
                shapes: shapes,
                brushes: {
                    green: { key: 'green', color: '#15781B', opacity: 1, lineWidth: 10 },
                    red: { key: 'red', color: '#882020', opacity: 1, lineWidth: 10 },
                    blue: { key: 'blue', color: '#003088', opacity: 1, lineWidth: 10 },
                    yellow: { key: 'yellow', color: '#e68500', opacity: 1, lineWidth: 10 },
                },
                onChange: (newShapes) => {
                    setShapes(newShapes);
                    if (userRole === 'teacher') {
                        firebaseService.updateRoom(teacherId, { shapes: newShapes });
                    }
                }
            },
            events: {
                move: (orig, dest) => handleUserMove(orig, dest)
            }
        };

        const api = NativeChessground(visualBoardRef.current, config);
        apiRef.current = api;

        return () => api.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateGameState = async (chessInstance: Chess, moveArr: [Key, Key] | null, newHistory?: string[], newFenHistory?: string[], newIdx?: number) => {
        const newFen = chessopsFen.makeFen(chessInstance.toSetup());
        const turnColor = chessInstance.turn;
        const currentHistory = newHistory || historyRef.current;
        const currentFenHistory = newFenHistory || fenHistoryRef.current;
        const activeIdx = newIdx !== undefined ? newIdx : currentIndexRef.current;

        // Atomic update of refs
        historyRef.current = currentHistory;
        fenHistoryRef.current = currentFenHistory;
        currentIndexRef.current = activeIdx;

        setFen(newFen);
        setLastMove(moveArr);
        setTurn(turnColor === 'white' ? 'w' : 'b');
        setShapes([]);
        setHistory(currentHistory);
        setFenHistory(currentFenHistory);
        setCurrentIndex(activeIdx);

        const gameOver = chessInstance.isEnd();
        setIsGameOver(gameOver);

        // Extract comment from PGN if available (Only for teachers)
        let currentComment = "";
        if (userRole === 'teacher' && chapterPgn) {
            try {
                const tempGame = new ChessJS();
                const cleanPgn = lichessService.sanitizePgn(chapterPgn);

                try {
                    (tempGame as any).loadPgn(cleanPgn);
                } catch (e) {
                    const fenOnly = cleanPgn.match(/\[FEN "(.*)"\]/);
                    if (fenOnly) tempGame.load(fenOnly[1]);
                }

                // Replay moves to find the comment for the current position
                tempGame.reset();
                for (let i = 0; i <= activeIdx; i++) {
                    if (currentHistory[i]) {
                        try {
                            tempGame.move(currentHistory[i]);
                        } catch (moveErr) {
                            break;
                        }
                    }
                }
                currentComment = tempGame.getComment() || "";
            } catch (e) {
                console.warn("Could not extract comment from PGN", e);
            }
        }

        if (onGameStateChange) {
            onGameStateChange({
                fen: newFen,
                history: currentHistory,
                turn: turnColor === 'white' ? 'w' : 'b',
                isGameOver: gameOver,
                orientation: orientation,
                currentIndex: activeIdx
            });
        }

        if (apiRef.current) {
            apiRef.current.set({
                fen: newFen,
                turnColor: turnColor,
                check: chessInstance.isCheck(),
                lastMove: moveArr || undefined,
                drawable: { shapes: [] },
                movable: {
                    color: userRole === 'teacher' ? 'both' : (turnColor),
                    dests: getDests(chessInstance)
                }
            });
        }

        await firebaseService.updateRoom(teacherId, {
            fen: newFen,
            lastMove: moveArr || null,
            orientation: orientation,
            history: currentHistory,
            fenHistory: currentFenHistory,
            currentIndex: activeIdx,
            shapes: [],
            comment: currentComment
        });
    };

    // ── Sync with Remote Room Data (Prop based) ──────────────────────────
    useEffect(() => {
        if (!roomData) return;

        const data = roomData;
        if (data.shapes && JSON.stringify(data.shapes) !== JSON.stringify(shapes)) {
            setShapes(data.shapes);
            apiRef.current?.set({ drawable: { shapes: data.shapes } });
        }

        if (data.fen) {
            const currentFen = chessopsFen.makeFen(chessRef.current.toSetup());
            // Sync history and currentIndex even if FEN is the same (navigation)
            if (data.fen !== currentFen || data.currentIndex !== currentIndexRef.current || data.history?.length !== historyRef.current.length) {
                try {
                    const setup = chessopsFen.parseFen(data.fen).unwrap();
                    const newPos = Chess.fromSetup(setup).unwrap();
                    chessRef.current = newPos;

                    const newHistory = data.history || [];
                    const newFenHistory = data.fenHistory || [chessopsFen.makeFen(Chess.default().toSetup())];
                    const newIdx = data.currentIndex !== undefined ? data.currentIndex : (newHistory.length - 1);

                    // Sync refs for immediate move handling
                    historyRef.current = newHistory;
                    fenHistoryRef.current = newFenHistory;
                    currentIndexRef.current = newIdx;

                    setFen(data.fen);
                    setLastMove(data.lastMove as [Key, Key] || null);
                    setTurn(newPos.turn === 'white' ? 'w' : 'b');
                    setIsGameOver(newPos.isEnd());
                    if (data.orientation) setOrientation(data.orientation);
                    setHistory(newHistory);
                    setFenHistory(newFenHistory);
                    setCurrentIndex(newIdx);

                    apiRef.current?.set({
                        fen: data.fen,
                        lastMove: data.lastMove as [Key, Key] || undefined,
                        orientation: data.orientation || orientation,
                        turnColor: newPos.turn,
                        check: newPos.isCheck(),
                        movable: {
                            color: userRole === 'teacher' ? 'both' : newPos.turn,
                            dests: getDests(newPos)
                        }
                    });

                    if (onGameStateChange) {
                        onGameStateChange({
                            fen: data.fen,
                            history: newHistory,
                            turn: newPos.turn === 'white' ? 'w' : 'b',
                            isGameOver: newPos.isEnd(),
                            orientation: data.orientation || orientation,
                            currentIndex: newIdx
                        });
                    }
                } catch (e) {
                    console.error("Remote sync error", e);
                }
            }
        }
    }, [roomData]);

    const handleGoToMove = (index: number) => {
        const hist = historyRef.current;
        const currentFenHist = fenHistoryRef.current;

        if (index < -1 || index >= hist.length) return;
        const targetIndex = index === -1 ? 0 : index + 1;
        const targetFen = currentFenHist[targetIndex];
        if (!targetFen) return;

        try {
            const setup = chessopsFen.parseFen(targetFen).unwrap();
            const newPos = Chess.fromSetup(setup).unwrap();
            chessRef.current = newPos;

            currentIndexRef.current = index;
            setCurrentIndex(index);
            setFen(targetFen);

            apiRef.current?.set({
                fen: targetFen,
                turnColor: newPos.turn,
                check: newPos.isCheck(),
                lastMove: undefined,
                movable: {
                    color: userRole === 'teacher' ? 'both' : newPos.turn,
                    dests: getDests(newPos)
                }
            });

            if (userRole === 'teacher') {
                firebaseService.updateRoom(teacherId, {
                    fen: targetFen,
                    lastMove: undefined,
                    currentIndex: index
                });
            }
        } catch (e) { console.error("Nav error", e); }
    };

    const handlePromotionSelect = (roleChar: string) => {
        if (!pendingPromotion) return;
        const chess = chessRef.current;
        const from = parseSquare(pendingPromotion.from as SquareName)!;
        const to = parseSquare(pendingPromotion.to as SquareName)!;
        const role = charToRole(roleChar);

        if (role) {
            const move: Move = { from, to, promotion: role };
            const newPos = chess.clone();
            if (newPos.isLegal(move)) {
                const sanMove = san.makeSan(chess, move);
                newPos.play(move);
                chessRef.current = newPos;
                play('promote');
                vibrate([20]); // Distinct vibration for promotion
                const newHistory = history.concat(sanMove);
                const newFen = chessopsFen.makeFen(newPos.toSetup());
                const newFenHistory = fenHistory.concat(newFen);
                const newIdx = newHistory.length - 1;

                setHistory(newHistory);
                setFenHistory(newFenHistory);
                setCurrentIndex(newIdx);
                updateGameState(newPos, [pendingPromotion.from, pendingPromotion.to], newHistory, newFenHistory, newIdx);
            }
        }
        setPendingPromotion(null);
    };

    const handleToggleOrientation = () => {
        const newO = orientation === 'white' ? 'black' : 'white';
        setOrientation(newO);
        apiRef.current?.set({ orientation: newO });
        firebaseService.updateRoom(teacherId, { orientation: newO });
    };

    const handleReset = async () => {
        const newPos = Chess.default();
        chessRef.current = newPos;
        const initialFen = chessopsFen.makeFen(newPos.toSetup());

        historyRef.current = [];
        fenHistoryRef.current = [initialFen];
        currentIndexRef.current = -1;

        setHistory([]);
        setFenHistory([initialFen]);
        setCurrentIndex(-1);
        await updateGameState(newPos, null, [], [initialFen], -1);
    };

    return (
        <div className="w-full h-full relative group bg-[#161512]">
            {/* Evaluation Bar Overlay */}
            {isAnalysisActive && lilaResult && (
                <div className="absolute top-0 left-[-32px] bottom-0 w-7 z-20">
                    <EngineEval
                        score={lilaResult.score}
                        mate={lilaResult.mate}
                        orientation={orientation}
                    />
                </div>
            )}

            <div ref={visualBoardRef} className="w-full h-full wood" />

            {/* Promotion UI Overlay */}
            {pendingPromotion && (
                <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-panel p-4 rounded-xl border border-gold/30 flex gap-4">
                        {['q', 'r', 'b', 'n'].map(p => (
                            <button key={p} onClick={() => handlePromotionSelect(p)} className="w-14 h-14 bg-dark-bg hover:bg-gold/10 rounded-lg flex items-center justify-center text-4xl border border-white/10 transition-all hover:scale-110">
                                <span className={turn === 'w' ? 'text-white' : 'text-gray-400'}>
                                    {p === 'q' ? '♕' : p === 'r' ? '♖' : p === 'b' ? '♗' : '♘'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Mini-Info Overlay */}
            {isAnalysisActive && !isLilaLoading && lilaResult && (
                <div className="absolute top-2 right-2 z-[50] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gold/60 uppercase font-black font-mono tracking-widest">Mejor Jugada</span>
                        <span className="text-[10px] text-white font-mono font-bold">{lilaResult.bestMove}</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Board;
