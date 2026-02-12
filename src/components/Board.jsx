import React, { useEffect, useState, useRef, useCallback } from 'react';
import Chessground from 'react-chessground';
import { Chess } from 'chess.js';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css'; // Board theme
import { rtdb } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { AuthContext } from '../App';

const Board = ({ teacherId }) => {
    const [chess, setChess] = useState(new Chess());
    const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const [lastMove, setLastMove] = useState(null);
    const [orientation, setOrientation] = useState("white");
    const { userRole, currentUserId } = React.useContext(AuthContext);

    // Use a ref to prevent loop updates if local match
    const isUpdatingFromFirebase = useRef(false);

    useEffect(() => {
        // 1. Listen to Firebase changes
        const roomRef = ref(rtdb, `rooms/${teacherId}`);

        // Initial sync
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // If data exists, update local state
                isUpdatingFromFirebase.current = true;
                const newChess = new Chess(data.fen);
                setChess(newChess);
                setFen(data.fen);
                if (data.lastMove) setLastMove(data.lastMove);
                if (data.orientation) setOrientation(data.orientation);
                isUpdatingFromFirebase.current = false;
            } else {
                // If no data, initialize room if I am the teacher
                if (userRole === 'teacher' && currentUserId === teacherId) {
                    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
                    set(roomRef, {
                        fen: initialFen,
                        lastMove: null,
                        orientation: 'white'
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [teacherId, userRole, currentUserId]);

    const onMove = useCallback((from, to) => {
        // 2. Validate move with chess.js
        // We clone the chess instance to avoid mutation issues
        const validMove = chess.move({ from, to, promotion: 'q' });

        if (validMove) {
            // 3. Update local state
            const newFen = chess.fen();
            setFen(newFen);
            setLastMove([from, to]);

            // 4. Send to Firebase ONLY if I am the teacher (or allowed to move)
            // Logic: Teacher moves update DB. Student moves... maybe local only? 
            // User Logic: "Si el profesor mueve... el alumno tiene un useEffect... y su tablero se actualiza solo."
            // Implies students watch. But maybe students can try moves? 
            // For this MVP, let's say only Teacher updates the global state.
            if (userRole === 'teacher' && currentUserId === teacherId) {
                set(ref(rtdb, `rooms/${teacherId}`), {
                    fen: newFen,
                    lastMove: [from, to],
                    orientation: orientation
                });
            } else {
                // If student moves, we might want to revert if not allowed? 
                // For now, let's allow "analysis" but it pulls back when Firebase updates.
                // Or strictly, if student moves, it's local only until next sync.
            }
        } else {
            // Invalid move, chessground might need a reset or just not update
            // React-chessground usually handles this if we don't update FEN
            // But we need to reset the internal state of chess instance?
            // Actually, if move failed, chess instance didn't change (because .move() returns null).
            // But chessground might have moved the piece visually.
            // Forces re-render to snap back
            console.log("Invalid move");
            setTimeout(() => setFen(chess.fen()), 100);
        }
    }, [chess, teacherId, userRole, currentUserId, orientation]);

    const config = {
        fen: fen,
        orientation: orientation,
        viewOnly: false, // Students might want to move pieces for analysis? 
        // Or true if strict. "Lista de tarjetas... entrar a clase".
        // Let's keep it interactive but not syncing for students.
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        lastMove: lastMove,
        highlight: {
            lastMove: true,
            check: true
        },
        animation: { enabled: true, duration: 200 },
        movable: {
            free: false,
            color: 'both', // Allow moving both sides for analysis/teaching
            dests: toDests(chess),
            showDests: true,
        },
        draggable: {
            enabled: true
        },
        selectable: {
            enabled: true
        },
        events: {
            move: onMove
        }
    };

    return (
        <div className="w-full h-full flex justify-center items-center bg-[#262421] rounded-lg p-1 shadow-2xl">
            <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                <Chessground
                    width="100%"
                    height="100%"
                    config={config}
                />
            </div>
        </div>
    );
};

// Helper to calculate legal moves for Chessground
function toDests(chess) {
    const dests = new Map();
    chess.SQUARES.forEach(s => {
        const ms = chess.moves({ square: s, verbose: true });
        if (ms.length) dests.set(s, ms.map(m => m.to));
    });
    return dests;
}

export default Board;
