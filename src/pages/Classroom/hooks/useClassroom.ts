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
    const [currentComment, setCurrentComment] = useState<string>("");
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(false);
    const [gameState, setGameState] = useState<GameState>({
        fen: 'start',
        history: [],
        turn: 'w',
        isGameOver: false,
    });

    // Lichess Integration
    useEffect(() => {
        if (teacherProfile?.lichessUsername) {
            lichessService.getUserStudies(teacherProfile.lichessUsername, teacherProfile.lichessAccessToken)
                .then(setLichessStudies)
                .catch(err => console.error("Error loading Lichess studies:", err));
        }
    }, [teacherProfile?.lichessUsername, teacherProfile?.lichessAccessToken]);

    // Initialization and Subscriptions
    useEffect(() => {
        if (!currentUserId || !teacherId) return;

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

                const unsubChat = firebaseService.subscribeToChat(uid1, uid2, (msgs) => {
                    setMessages(msgs);
                });

                const unsubRoom = firebaseService.subscribeToRoom(teacherId, (data) => {
                    if (data) {
                        if (data.chapters) setRoomChapters(data.chapters);
                        if (data.activeChapterIndex !== undefined) setActiveChapterIndex(data.activeChapterIndex);
                        if (data.comment !== undefined) setCurrentComment(data.comment || "");
                    }
                });

                setToken("ey_MOCK_TOKEN_FOR_MVP_PURPOSES_ONLY_ey");

                return () => {
                    unsubChat();
                    unsubRoom();
                };
            } catch (error) {
                console.error("Error initializing classroom:", error);
                toast.error("Error al conectar con el aula");
            }
        };

        const cleanup = initClassroom();
        return () => {
            cleanup.then(unsub => unsub?.());
        };
    }, [userRole, currentUserId, teacherId, navigate]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !teacherId) return;
        try {
            const msg: Omit<Message, 'id'> = {
                studentId: userRole === 'student' ? currentUserId : teacherId,
                teacherId: userRole === 'student' ? teacherId : currentUserId,
                text,
                sender: userRole || 'student',
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

    // ── Sanitize PGN ─────────────────────────────────────────────────────
    // Strips ALL Lichess system annotations while preserving human text.
    // Handles: { [%clk 0:05:00] [%eval 0.32] }  → removed
    //          { Nice move! [%clk 0:04:55] }     → { Nice move! }
    const sanitizePgn = useCallback((pgn: string): string => {
        return pgn
            .replace(/\r/g, '')
            // Strip Lichess metadata headers (cause chess.js parse failures)
            .replace(/\[(LichessId|Variant|Annotator|SIT|Clock|UTCDate|UTCTime|ChapterMode) "[^"]*"\]\s*/g, '')
            // Remove blocks that contain ONLY system annotations
            .replace(/\{\s*(\[%[^\]]+\]\s*)+\}/g, '')
            // Strip [%...] inside mixed comments that still have human text
            .replace(/\[%[^\]]+\]/g, '')
            // Normalize whitespace inside { }
            .replace(/\{\s+/g, '{ ')
            .replace(/\s+\}/g, ' }')
            // Collapse whitespace / blank lines
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }, []);

    const loadChapter = useCallback(async (idx: number) => {
        if (userRole !== 'teacher' || !teacherId || !roomChapters[idx]) return;
        const loadingToast = toast.loading(`Sincronizando capítulo ${idx + 1}...`);
        try {
            const game = new ChessJS();
            const cleanPgn = sanitizePgn(roomChapters[idx].pgn);

            try {
                (game as any).loadPgn(cleanPgn);
            } catch (e) {
                const fenOnly = cleanPgn.match(/\[FEN "(.*)"\]/);
                if (fenOnly) game.load(fenOnly[1]);
                else {
                    const bodyOnly = cleanPgn.split('\n\n').pop() || "";
                    if (bodyOnly) (game as any).loadPgn(bodyOnly);
                    else throw new Error("Invalid format");
                }
            }

            await firebaseService.updateRoom(teacherId, {
                activeChapterIndex: idx,
                fen: game.fen(),
                history: game.history(),
                lastMove: null,
                currentIndex: Math.max(0, game.history().length - 1),
                comment: game.getComment() || ""
            });
            toast.success(`Capítulo cargado`, { id: loadingToast });
        } catch (error) {
            console.error("Error loading chapter:", error);
            toast.error("Error al cargar capítulo", { id: loadingToast });
        }
    }, [userRole, teacherId, roomChapters, sanitizePgn]);

    const importStudy = useCallback(async (studyId: string, studyName: string) => {
        if (userRole !== 'teacher' || !teacherId) return;
        const loadingToast = toast.loading(`Conectando con Lichess...`);
        try {
            const pgn = await lichessService.getStudyPgn(studyId, teacherProfile?.lichessAccessToken);
            if (!pgn) throw new Error("No PGN");

            const chapters = lichessService.parseChapters(pgn);
            if (chapters.length === 0) throw new Error("Empty study");

            const game = new ChessJS();
            const firstClean = sanitizePgn(chapters[0].pgn);

            try {
                (game as any).loadPgn(firstClean);
            } catch (e) {
                const fenOnly = firstClean.match(/\[FEN "(.*)"\]/);
                if (fenOnly) game.load(fenOnly[1]);
            }

            await firebaseService.updateRoom(teacherId, {
                chapters: chapters,
                activeChapterIndex: 0,
                fen: game.fen(),
                history: game.history(),
                lastMove: null,
                currentIndex: Math.max(0, game.history().length - 1),
                comment: game.getComment() || ""
            });

            toast.success(`Estudio "${studyName}" importado`, { id: loadingToast });
        } catch (error) {
            console.error("Error importing study:", error);
            toast.error("Error al importar estudio", { id: loadingToast });
        }
    }, [userRole, teacherId, teacherProfile?.lichessAccessToken, sanitizePgn]);


    const injectPgnFen = useCallback(async (val: string) => {
        if (!val || !teacherId) return;
        const loadingToast = toast.loading("Procesando...");
        try {
            const game = new ChessJS();
            try {
                const cleaned = sanitizePgn(val);
                (game as any).loadPgn(cleaned);
                await firebaseService.updateRoom(teacherId, {
                    fen: game.fen(),
                    history: game.history(),
                    lastMove: null,
                    currentIndex: game.history().length - 1,
                    comment: game.getComment() || ""
                });
                toast.success("Cargado correctamente", { id: loadingToast });
            } catch (e) {
                // Fallback: try as FEN
                await firebaseService.updateRoom(teacherId, {
                    fen: val,
                    history: [],
                    lastMove: null,
                    currentIndex: -1,
                    comment: ""
                });
                toast.success("FEN cargado", { id: loadingToast });
            }
        } catch (error) {
            console.error("Error injecting PGN/FEN:", error);
            toast.error("Error en formato", { id: loadingToast });
        }
    }, [teacherId]);

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
        gameState,
        handleGameStateChange,
        handleSendMessage,
        loadChapter,
        importStudy,
        injectPgnFen,
        userRole,
        currentUserId
    };
};
