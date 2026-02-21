import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../../../services/firebaseService';
import { lichessService, LichessStudy } from '../../../services/lichessService';
import { useAuth } from '../../../App';
import { Teacher, Message, GameState } from '../../../types/index';
import { Chess as ChessJS } from 'chess.js';
import toast from 'react-hot-toast';

export const useClassroom = (teacherId: string | undefined) => {
    const { userRole, currentUserId } = useAuth();
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [lichessStudies, setLichessStudies] = useState<LichessStudy[]>([]);
    const [roomChapters, setRoomChapters] = useState<{ name: string, pgn: string }[]>([]);
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);
    const [comments, setComments] = useState<Record<number, string>>({});
    const [currentComment, setCurrentComment] = useState<string>("");
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(false);
    const [roomData, setRoomData] = useState<any>(null);
    const [gameState, setGameState] = useState<GameState>({
        fen: 'start',
        history: [],
        turn: 'w',
        isGameOver: false,
    });

    // Extract all comments from a ChessJS game object
    const extractComments = useCallback((game: ChessJS) => {
        const map: Record<number, string> = {};
        const history = game.history({ verbose: true });

        while (game.undo()) { }

        const initialC = game.getComment();
        if (initialC) map[-1] = initialC;

        for (let i = 0; i < history.length; i++) {
            game.move(history[i].san);
            const c = game.getComment();
            if (c) map[i] = c;
        }

        return map;
    }, []);

    // Initialization and Subscriptions
    useEffect(() => {
        if (!currentUserId || !teacherId) return;

        let unsubChat: (() => void) | undefined;
        let unsubRoom: (() => void) | undefined;

        const initClassroom = async () => {
            try {
                if (userRole === 'student') {
                    const status = await firebaseService.getRequestStatus(currentUserId, teacherId);
                    if (status !== 'approved') {
                        toast.error("Debes solicitar acceso al profesor primero.");
                        navigate(`/chat/${teacherId}`);
                        return;
                    }
                }

                const profile = await firebaseService.getTeacherById(teacherId);
                setTeacherProfile(profile);

                const uid1 = userRole === 'student' ? currentUserId : teacherId;
                const uid2 = userRole === 'student' ? teacherId : currentUserId;

                unsubChat = firebaseService.subscribeToChat(uid1, uid2, (msgs) => {
                    setMessages(msgs);
                });

                unsubRoom = firebaseService.subscribeToRoom(teacherId, (data) => {
                    if (data) {
                        setRoomData(data);
                        if (data.chapters) setRoomChapters(data.chapters);
                        if (data.activeChapterIndex !== undefined) setActiveChapterIndex(data.activeChapterIndex);
                        if (data.comment !== undefined) setCurrentComment(data.comment || "");
                        if (data.comments) setComments(data.comments);

                        // Sync shared game state for sidebar/header visibility
                        setGameState(prev => ({
                            ...prev,
                            fen: data.fen || 'start',
                            history: data.history || [],
                            currentIndex: data.currentIndex,
                            orientation: data.orientation
                        }));
                    }
                });

                const tk = await firebaseService.getLiveKitToken(
                    teacherId,
                    currentUserId || 'guest',
                    (userRole || 'student') as 'student' | 'teacher' | 'admin'
                );
                setToken(tk);
            } catch (error) {
                console.error("Error initializing classroom:", error);
                toast.error("Error al conectar con el aula");
            }
        };

        initClassroom();
        return () => {
            if (unsubChat) unsubChat();
            if (unsubRoom) unsubRoom();
        };
    }, [userRole, currentUserId, teacherId, navigate]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !teacherId) return;
        try {
            const msg: Omit<Message, 'id'> = {
                studentId: userRole === 'student' ? currentUserId : teacherId,
                teacherId: userRole === 'student' ? teacherId : currentUserId,
                text,
                sender: (userRole || 'student') as 'student' | 'teacher' | 'admin',
                timestamp: Date.now(),
                type: 'text'
            };
            await firebaseService.sendMessage(msg);
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Error al enviar mensaje");
        }
    }, [currentUserId, teacherId, userRole]);

    const handleGameStateChange = useCallback((newState: GameState) => {
        setGameState(newState);
    }, []);

    const loadChapter = useCallback(async (idx: number) => {
        if (userRole !== 'teacher' || !teacherId || !roomChapters[idx]) return;
        const loadingToast = toast.loading(`Sincronizando capítulo ${idx + 1}...`);

        try {
            const game = new ChessJS();
            const pgn = roomChapters[idx].pgn;
            const cleanPgn = lichessService.sanitizePgn(pgn);

            let loaded = false;
            try {
                if (cleanPgn.split(/\s+/).length < 6 && (cleanPgn.includes('/') || cleanPgn.includes('w') || cleanPgn.includes('b'))) throw new Error("FEN");
                (game as any).loadPgn(cleanPgn);
                loaded = true;
            } catch (e) {
                try {
                    const fenMatch = pgn.match(/\[FEN "([^"]+)"\]/);
                    if (fenMatch) { game.load(fenMatch[1]); loaded = true; }
                } catch (e2) { }
            }
            if (!loaded) {
                try { game.load(cleanPgn); loaded = true; } catch (e3) { }
            }
            if (!loaded) {
                let rawMoves = cleanPgn.replace(/\[.*?\]/g, "").replace(/\{.*?\}/g, "").replace(/;.*$/gm, "").trim();
                if (rawMoves.length > 0) {
                    try { (game as any).loadPgn(`[Event "Live"]\n[Site "TopChess"]\n\n${rawMoves}`); loaded = true; } catch (e4) { }
                }
            }

            if (!loaded) {
                game.reset();
                toast.error("Formato no reconocido", { id: loadingToast });
            } else {
                toast.success(`Capítulo cargado`, { id: loadingToast });
            }

            const extractedComments = extractComments(game);
            await firebaseService.updateRoom(teacherId, {
                activeChapterIndex: idx,
                fen: game.fen(),
                history: game.history(),
                lastMove: null,
                currentIndex: Math.max(0, game.history().length - 1),
                comment: game.getComment() || "",
                comments: extractedComments
            });
        } catch (error) {
            console.error("Error in loadChapter:", error);
            toast.error("Error al cargar capítulo", { id: loadingToast });
        }
    }, [userRole, teacherId, roomChapters, extractComments]);

    const importStudy = useCallback(async (studyId: string, studyName: string) => {
        if (userRole !== 'teacher' || !teacherId) return;
        const loadingToast = toast.loading(`Importando estudio...`);
        try {
            const pgn = await lichessService.getStudyPgn(studyId, teacherProfile?.lichessAccessToken);
            if (!pgn) throw new Error("No PGN");

            const chapters = lichessService.parseChapters(pgn);
            if (chapters.length === 0) throw new Error("Empty study");

            const game = new ChessJS();
            const firstPgn = lichessService.sanitizePgn(chapters[0].pgn);

            try {
                (game as any).loadPgn(firstPgn);
            } catch (e) {
                const fenMatch = firstPgn.match(/\[FEN "([^"]+)"\]/);
                if (fenMatch) game.load(fenMatch[1]);
            }

            const extractedComments = extractComments(game);
            await firebaseService.updateRoom(teacherId, {
                chapters: chapters,
                activeChapterIndex: 0,
                fen: game.fen(),
                history: game.history(),
                lastMove: null,
                currentIndex: Math.max(0, game.history().length - 1),
                comment: game.getComment() || "",
                comments: extractedComments
            });

            toast.success(`Estudio "${studyName}" importado`, { id: loadingToast });
        } catch (error) {
            console.error("Error importing study:", error);
            toast.error("Error al importar estudio", { id: loadingToast });
        }
    }, [userRole, teacherId, teacherProfile?.lichessAccessToken, extractComments]);

    const injectPgnFen = useCallback(async (val: string) => {
        if (!val || !teacherId) return;
        const loadingToast = toast.loading("Procesando...");
        try {
            const game = new ChessJS();
            try {
                const cleaned = lichessService.sanitizePgn(val);
                (game as any).loadPgn(cleaned);
                const extractedComments = extractComments(game);

                await firebaseService.updateRoom(teacherId, {
                    fen: game.fen(),
                    history: game.history(),
                    lastMove: null,
                    currentIndex: game.history().length - 1,
                    comment: game.getComment() || "",
                    comments: extractedComments
                });
                toast.success("Cargado correctamente", { id: loadingToast });
            } catch (e) {
                await firebaseService.updateRoom(teacherId, {
                    fen: val,
                    history: [],
                    lastMove: null,
                    currentIndex: -1,
                    comment: "",
                    comments: {}
                });
                toast.success("FEN cargado", { id: loadingToast });
            }
        } catch (error) {
            console.error("Error injecting:", error);
            toast.error("Error en formato", { id: loadingToast });
        }
    }, [teacherId, extractComments]);
    const exportCurrentState = useCallback(() => {
        try {
            const game = new ChessJS();
            if (gameState.fen !== 'start' && gameState.history.length === 0) {
                game.load(gameState.fen);
            } else {
                for (const move of gameState.history) {
                    game.move(move);
                }
            }

            game.reset();
            if (comments[-1]) { game.setComment(typeof comments[-1] === 'string' ? comments[-1] : (comments[-1] as any).text); }
            for (let i = 0; i < gameState.history.length; i++) {
                game.move(gameState.history[i]);
                if (comments[i]) {
                    const c = typeof comments[i] === 'string' ? comments[i] : (comments[i] as any).text;
                    if (c) game.setComment(c);
                }
            }

            const pgn = game.pgn({ maxWidth: 80, newline: '\n' });
            const blob = new Blob([pgn], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `TopChess_Capitulo_${activeChapterIndex >= 0 ? activeChapterIndex + 1 : '1'}.pgn`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("PGN exportado");
        } catch (error) {
            console.error("Error exporting PGN:", error);
            toast.error("Error al exportar");
        }
    }, [gameState.fen, gameState.history, comments, activeChapterIndex]);

    return {
        token,
        teacherProfile,
        messages,
        lichessStudies,
        roomChapters,
        setRoomChapters,
        activeChapterIndex,
        setActiveChapterIndex,
        currentComment,
        setCurrentComment,
        isAudioEnabled,
        setIsAudioEnabled,
        isAnalysisEnabled,
        setIsAnalysisEnabled,
        roomData,
        gameState,
        handleGameStateChange,
        handleSendMessage,
        loadChapter,
        importStudy,
        injectPgnFen,
        exportCurrentState,
        userRole,
        currentUserId,
        comments
    };
};
