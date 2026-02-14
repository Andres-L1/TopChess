import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import Board, { BoardHandle } from '../components/Board';
// LiveKit imports
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import Logo from '../components/Logo';
import MoveHistory from '../components/MoveHistory';
import CapturedPieces from '../components/CapturedPieces';
import { MessageSquare, BookOpen, LogOut, ChevronRight, ScrollText, Send, Activity, ChevronLeft, ChevronsLeft, ChevronsRight, Trophy, Zap, Clock, RotateCcw, Monitor, Settings, Download, Trash2, Check, ExternalLink } from 'lucide-react';
import { GameState, Teacher, Message } from '../types/index';
import toast from 'react-hot-toast';
import { Chess as ChessJS } from 'chess.js';
import { lichessService, LichessStudy } from '../services/lichessService';

const Classroom: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { userRole, currentUserId } = useAuth();
    const [token, setToken] = useState("");
    const [activeTab, setActiveTab] = useState('game');
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const boardRef = useRef<BoardHandle>(null);
    const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(false);
    const [lichessStudies, setLichessStudies] = useState<LichessStudy[]>([]);
    const [roomChapters, setRoomChapters] = useState<{ name: string, pgn: string }[]>([]);
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);
    const [currentComment, setCurrentComment] = useState<string>("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [gameState, setGameState] = useState<GameState>({
        fen: 'start',
        history: [],
        turn: 'w',
        isGameOver: false,
    });

    const navigate = useNavigate();
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    useEffect(() => {
        if (teacherProfile?.lichessUsername) {
            lichessService.getUserStudies(teacherProfile.lichessUsername, teacherProfile.lichessAccessToken).then(setLichessStudies);
        }
    }, [teacherProfile?.lichessUsername, teacherProfile?.lichessAccessToken]);

    useEffect(() => {
        const initClassroom = async () => {
            if (userRole === 'student') {
                const s = await firebaseService.getRequestStatus(currentUserId, teacherId!);
                if (s !== 'approved') {
                    toast.error("Debes solicitar acceso al profesor primero.");
                    navigate(`/chat/${teacherId}`);
                    return;
                }
            }

            const profile = await firebaseService.getTeacherById(teacherId!);
            setTeacherProfile(profile);

            const uid1 = userRole === 'student' ? currentUserId : teacherId!;
            const uid2 = userRole === 'student' ? teacherId! : currentUserId;

            const unsubChat = firebaseService.subscribeToChat(uid1, uid2, (msgs) => {
                setMessages(msgs);
            });

            const unsubRoom = firebaseService.subscribeToRoom(teacherId!, (data) => {
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
        };

        if (currentUserId && teacherId) {
            initClassroom();
        }
    }, [userRole, currentUserId, teacherId, navigate]);

    const handleGameStateChange = (newState: GameState) => {
        setGameState(newState);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const msg: Omit<Message, 'id'> = {
            studentId: userRole === 'student' ? currentUserId : teacherId!,
            teacherId: userRole === 'student' ? teacherId! : currentUserId,
            text: inputText,
            sender: userRole || 'student',
            timestamp: Date.now(),
            type: 'text'
        };
        await firebaseService.sendMessage(msg);
        setInputText("");
    };

    if (!token) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0e0d0c] text-gold font-bold uppercase tracking-widest text-xs gap-6">
            <Logo className="w-16 h-16 animate-bounce" />
            <span className="animate-pulse">Sincronizando Estudio...</span>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#161512] text-[#bababa] selection:bg-gold selection:text-black overflow-hidden">
            {/* Header - Slim & Fixed */}
            <header className="flex-none h-12 bg-[#1b1a17] border-b border-white/5 flex items-center justify-between px-6 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                        <Logo className="w-6 h-6 text-gold" />
                        <h1 className="font-black text-sm tracking-tighter text-white">TOP<span className="text-gold">CHESS</span> <span className="text-[10px] text-white/30 ml-2 font-light">ESTUDIO</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => {
                            const nextState = !isVideoEnabled;
                            setIsVideoEnabled(nextState);
                            if (nextState && userRole === 'teacher') {
                                boardRef.current?.reset();
                                toast.success("Estudio reseteado para la clase");
                            }
                        }}
                        className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isVideoEnabled ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-gold border-gold/20 hover:bg-gold/10'}`}
                    >
                        <Activity size={12} className={isVideoEnabled ? 'animate-pulse' : ''} />
                        <span className="hidden xs:inline">{isVideoEnabled ? 'Clase iniciada' : 'Iniciar Clase'}</span>
                        <span className="xs:hidden">{isVideoEnabled ? 'ON' : 'LIVE'}</span>
                    </button>
                    <button
                        onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')}
                        className="p-1.5 text-white/20 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-grow flex relative overflow-hidden">
                {/* LARGE BOARD AREA */}
                <main className={`flex-grow bg-[#0e0d0c] flex flex-col items-center justify-center relative transition-all duration-300 ${isSidePanelOpen && !isMobile ? 'pr-[450px]' : ''} p-4 md:p-12 overflow-hidden`}>
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1917_0%,_transparent_100%)] pointer-events-none opacity-50"></div>

                    <div className="w-full max-w-[1200px] h-full flex flex-col gap-4 relative z-10 justify-center">
                        {/* Player Top - Compact */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded bg-gold/10 border border-gold/20 flex items-center justify-center">
                                    <Trophy size={16} className="text-gold" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-white uppercase tracking-tight">{teacherProfile?.name || 'Maestro'}</span>
                                        {teacherProfile?.title && (
                                            <span className="px-1 py-0.5 bg-gold text-black text-[8px] rounded font-black tracking-widest leading-none shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                                                {teacherProfile.title}
                                            </span>
                                        )}
                                        {teacherProfile?.isVerified && (
                                            <Check size={10} className="text-blue-400 bg-blue-400/10 rounded-full p-0.5" />
                                        )}
                                    </div>
                                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{teacherProfile?.elo || 2400} ELO</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-white/5">
                                    <Clock size={12} className="text-white/20" />
                                    <span className="text-sm font-mono text-white/90">00:00</span>
                                </div>
                            </div>
                        </div>

                        {/* BOARD - Strictly Square & Proportional */}
                        <div className="flex-grow flex items-center justify-center min-h-0 relative">
                            <div className="h-full aspect-square relative shadow-[0_30px_60px_rgba(0,0,0,0.7)] border-[4px] border-[#1b1a17] rounded shadow-inner">
                                <Board
                                    ref={boardRef}
                                    teacherId={teacherId!}
                                    onGameStateChange={handleGameStateChange}
                                    isAnalysisEnabled={isAnalysisEnabled}
                                    chapterPgn={roomChapters[activeChapterIndex]?.pgn}
                                />

                                {isVideoEnabled && (
                                    <div className="absolute top-4 right-4 w-40 aspect-video bg-black rounded-lg border border-white/10 shadow-2xl overflow-hidden z-50">
                                        <LiveKitRoom video={true} audio={true} token={token} serverUrl="wss://topchess-demo-call.livekit.cloud" style={{ height: '100%' }}>
                                            <div className="h-full flex items-center justify-center text-[8px] font-black uppercase text-gold/20">Conectando...</div>
                                        </LiveKitRoom>
                                    </div>
                                )}
                            </div>

                            <div className="absolute -bottom-16 md:-bottom-12 flex items-center gap-1 bg-[#1b1a17] px-3 py-2 md:px-2 md:py-1 rounded-2xl border border-white/5 shadow-2xl z-20">
                                {userRole === 'teacher' && activeChapterIndex !== -1 && (
                                    <button
                                        onClick={async () => {
                                            const chapter = roomChapters[activeChapterIndex];
                                            if (!chapter) return;
                                            const game = new ChessJS();
                                            const cleanPgn = chapter.pgn
                                                .replace(/\[(LichessId|Variant|Annotator|SIT|Clock|UTCDate|UTCTime) ".*"\]/g, "")
                                                .replace(/\{(\[%clk [^\]]+\]|\[%eval [^\]]+\])\}/g, "")
                                                .replace(/\r/g, "");

                                            try {
                                                (game as any).loadPgn(cleanPgn);
                                            } catch (e) {
                                                const fenOnly = cleanPgn.match(/\[FEN "(.*)"\]/);
                                                if (fenOnly) game.load(fenOnly[1]);
                                            }

                                            await firebaseService.updateRoom(teacherId!, {
                                                fen: game.fen(),
                                                history: game.history(),
                                                lastMove: null,
                                                currentIndex: Math.max(0, game.history().length - 1),
                                                comment: game.getComment() || ""
                                            });
                                            toast.success("Capítulo reiniciado");
                                        }}
                                        className="p-3 md:p-2 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all border-r border-white/5 mr-1"
                                        title="Reiniciar Capítulo"
                                    >
                                        <RotateCcw size={20} className="md:w-4 md:h-4" />
                                    </button>
                                )}
                                <button onClick={() => boardRef.current?.goToMove(-1)} className="p-3 md:p-2 hover:bg-gold/20 text-white/20 hover:text-gold transition-all"><ChevronsLeft size={22} className="md:w-4 md:h-4" /></button>
                                <button onClick={() => boardRef.current?.goToMove((gameState.currentIndex ?? -1) - 1)} className="p-3 md:p-2 hover:bg-gold/20 text-white/20 hover:text-gold transition-all"><ChevronLeft size={22} className="md:w-4 md:h-4" /></button>
                                <div className="w-[1px] h-6 md:h-4 bg-white/5 mx-1"></div>
                                <button onClick={() => boardRef.current?.goToMove((gameState.currentIndex ?? -1) + 1)} className="p-3 md:p-2 hover:bg-gold/20 text-white/20 hover:text-gold transition-all"><ChevronRight size={22} className="md:w-4 md:h-4" /></button>
                                <button onClick={() => boardRef.current?.goToMove((gameState.history?.length || 0) - 1)} className="p-3 md:p-2 hover:bg-gold/20 text-white/20 hover:text-gold transition-all"><ChevronsRight size={22} className="md:w-4 md:h-4" /></button>
                            </div>
                        </div>

                        {/* Move Commentary */}
                        {currentComment && (
                            <div className="mt-20 md:mt-14 p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto mb-4 md:mb-0">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 border border-gold/10">
                                        <BookOpen size={20} className="text-gold" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[10px] font-black text-gold uppercase tracking-widest">Nota de la Posición</h4>
                                            <div className="h-[1px] w-8 bg-gold/20"></div>
                                        </div>
                                        <p className="text-sm text-white/90 leading-relaxed font-medium italic">
                                            "{currentComment}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Player Bottom - Compact */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl mt-8 md:mt-0">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-green-500 uppercase">{currentUserId?.substring(0, 2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-white uppercase tracking-tight">Tú</span>
                                        <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[8px] rounded font-black tracking-widest border border-green-500/20">STUDENT</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Activity size={8} className="text-green-500 animate-pulse" />
                                        <span className="text-[9px] text-green-500/50 font-bold uppercase tracking-widest">En línea</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-white/5">
                                <Clock size={12} className="text-white/10" />
                                <span className="text-sm font-mono text-white/90">00:00</span>
                            </div>
                        </div>
                    </div>
                </main>

                {/* STUDY SIDEBAR - Drawer on Mobile, Persistent on Desktop */}
                <aside className={`
                    fixed md:absolute top-12 bottom-0 right-0 
                    ${isMobile ? 'w-full z-[60]' : 'w-[450px] z-30 border-l border-white/5'} 
                    bg-[#161512] flex flex-col transition-all duration-300 ease-in-out
                    ${isSidePanelOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className={`
                            absolute top-1/2 -translate-y-1/2 
                            ${isMobile ? 'left-4' : '-left-8'}
                            ${isMobile && isSidePanelOpen ? '-left-12 opacity-0 pointer-events-none' : ''}
                            w-8 h-16 bg-[#161512] border border-white/5 border-r-0 rounded-l-xl flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all z-[70] shadow-[-10px_0_20px_rgba(0,0,0,0.5)]
                        `}
                    >
                        <ChevronRight className={`transition-transform duration-500 ${isSidePanelOpen ? '' : 'rotate-180'}`} size={20} />
                    </button>

                    <nav className="flex-none flex bg-[#1b1a17] border-b border-white/5 sticky top-0 z-20">
                        <button onClick={() => setActiveTab('game')} className={`flex-1 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'game' ? 'text-gold bg-white/[0.02] border-b-2 border-gold shadow-[0_4px_15px_rgba(212,175,55,0.1)]' : 'text-white/30 hover:text-white/60'}`}>
                            <ScrollText size={14} /> <span className={isMobile ? 'hidden xs:inline' : 'inline'}>Partida</span>
                        </button>
                        <button onClick={() => setActiveTab('lichess')} className={`flex-1 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'lichess' ? 'text-gold bg-white/[0.02] border-b-2 border-gold shadow-[0_4px_15px_rgba(212,175,55,0.1)]' : 'text-white/30 hover:text-white/60'}`}>
                            <BookOpen size={14} /> <span className={isMobile ? 'hidden xs:inline' : 'inline'}>Estudios</span>
                        </button>
                        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'chat' ? 'text-gold bg-white/[0.02] border-b-2 border-gold shadow-[0_4px_15px_rgba(212,175,55,0.1)]' : 'text-white/30 hover:text-white/60'}`}>
                            <MessageSquare size={14} /> <span className={isMobile ? 'hidden xs:inline' : 'inline'}>Chat</span>
                        </button>
                        {isMobile && (
                            <button onClick={() => setIsSidePanelOpen(false)} className="px-4 text-white/20 hover:text-white">
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </nav>

                    <div className="flex-grow overflow-y-auto relative bg-[#12110f] custom-scrollbar">
                        {activeTab === 'game' && (
                            <div className="h-full flex flex-col p-4 gap-4 animate-in fade-in duration-300">
                                {/* Analysis quick toggle */}
                                <div className="flex-none flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isAnalysisEnabled ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'}`}>
                                            <Monitor size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Análisis Cloud</span>
                                            <span className="text-[8px] text-white/30 uppercase mt-1">Lila Engine Active</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAnalysisEnabled(!isAnalysisEnabled)}
                                        className={`w-10 h-6 rounded-full relative transition-all ${isAnalysisEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAnalysisEnabled ? 'left-5' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex-grow flex flex-col min-h-0 gap-4">
                                    <div className="flex-grow overflow-hidden relative">
                                        <MoveHistory
                                            moves={gameState.history}
                                            currentIndex={gameState.currentIndex ?? -1}
                                            onMoveClick={(idx) => boardRef.current?.goToMove(idx)}
                                        />
                                    </div>
                                    <div className="flex-none">
                                        <CapturedPieces fen={gameState.fen} orientation={gameState.orientation || 'white'} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lichess' && (
                            <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar animate-in fade-in duration-500">
                                {roomChapters.length > 0 ? (
                                    /* ACTIVE STUDY VIEW */
                                    <div className="space-y-6">
                                        <div className="bg-gold/5 border border-gold/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                                                    <BookOpen size={20} className="text-gold" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-gold/40 uppercase tracking-widest leading-none">Clase en Curso</span>
                                                    <h4 className="text-xs font-bold text-white mt-1 leading-tight">Estudio de Lichess</h4>
                                                </div>
                                            </div>
                                            {userRole === 'teacher' && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("¿Volver a la biblioteca? El estudio actual se mantendrá en pantalla.")) {
                                                            setRoomChapters([]);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
                                                >
                                                    Cerrar
                                                </button>
                                            )}
                                        </div>

                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <h3 className="text-gold font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <ScrollText size={14} /> Capítulos
                                                </h3>
                                                <span className="text-[9px] font-bold text-white/20 bg-white/5 py-1 px-2 rounded-lg">
                                                    {roomChapters.length} TOTAL
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                {roomChapters.map((chapter, idx) => (
                                                    <button
                                                        key={idx}
                                                        disabled={userRole !== 'teacher'}
                                                        onClick={async () => {
                                                            const loadingToast = toast.loading(`Sincronizando capítulo ${idx + 1}...`);
                                                            try {
                                                                const game = new ChessJS();
                                                                const cleanPgn = chapter.pgn
                                                                    .replace(/\[(LichessId|Variant|Annotator|SIT|Clock|UTCDate|UTCTime) ".*"\]/g, "")
                                                                    .replace(/\{(\[%clk [^\]]+\]|\[%eval [^\]]+\])\}/g, "")
                                                                    .replace(/\r/g, "");

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

                                                                await firebaseService.updateRoom(teacherId!, {
                                                                    activeChapterIndex: idx,
                                                                    fen: game.fen(),
                                                                    history: game.history(),
                                                                    lastMove: null,
                                                                    currentIndex: Math.max(0, game.history().length - 1),
                                                                    comment: game.getComment() || ""
                                                                });
                                                                toast.success(`Capítulo cargado`, { id: loadingToast });
                                                            } catch (e) {
                                                                toast.error("Error al cargar capítulo", { id: loadingToast });
                                                            }
                                                        }}
                                                        className={`w-full group p-3.5 rounded-xl text-left border transition-all flex items-center gap-4 relative overflow-hidden ${activeChapterIndex === idx
                                                            ? 'bg-gradient-to-br from-gold/20 via-gold/5 to-transparent border-gold/40 text-gold shadow-lg shadow-gold/5'
                                                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.08] hover:border-white/10 hover:text-white/80'
                                                            } ${userRole !== 'teacher' ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        {activeChapterIndex === idx && (
                                                            <div className="absolute inset-y-0 left-0 w-1 bg-gold shadow-[0_0_15px_rgba(212,175,55,0.8)]"></div>
                                                        )}

                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-black border transition-all ${activeChapterIndex === idx
                                                            ? 'bg-gold text-black border-gold'
                                                            : 'bg-black/40 border-white/5 text-white/20 group-hover:border-white/20'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>

                                                        <div className="flex-grow min-w-0">
                                                            <p className={`text-[11px] font-bold truncate tracking-tight ${activeChapterIndex === idx ? 'text-white' : ''}`}>
                                                                {chapter.name}
                                                            </p>
                                                            {activeChapterIndex === idx && (
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gold/60">Visible para alumnos</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {activeChapterIndex === idx ? (
                                                            <Activity size={14} className="text-gold" />
                                                        ) : (
                                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    /* LIBRARY VIEW */
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="text-center py-12 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold/20 shadow-xl shadow-gold/5">
                                                <Trophy size={32} className="text-gold" />
                                            </div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Biblioteca Lichess</h4>
                                            <p className="text-[10px] text-white/40 leading-relaxed max-w-[220px] mx-auto italic">
                                                Importa estudios de tu cuenta para usarlos como material de clase.
                                            </p>
                                        </div>

                                        {userRole === 'teacher' && teacherProfile?.lichessUsername ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <h3 className="text-gold font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Activity size={12} className="text-[#ff5e5e]" /> Mis Estudios
                                                    </h3>
                                                    <span className="text-[9px] font-bold text-white/20">{lichessStudies.length} DISPONIBLES</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {lichessStudies.length > 0 ? (
                                                        lichessStudies.map(study => (
                                                            <button
                                                                key={study.id}
                                                                onClick={async () => {
                                                                    const loadingToast = toast.loading(`Conectando con Lichess...`);
                                                                    try {
                                                                        const pgn = await lichessService.getStudyPgn(study.id, teacherProfile?.lichessAccessToken);
                                                                        if (!pgn) throw new Error("No PGN");

                                                                        const chapters = lichessService.parseChapters(pgn);
                                                                        if (chapters.length === 0) throw new Error("Empty study");

                                                                        const game = new ChessJS();
                                                                        const firstClean = chapters[0].pgn
                                                                            .replace(/\[(LichessId|Variant|Annotator|SIT|Clock|UTCDate|UTCTime) ".*"\]/g, "")
                                                                            .replace(/\{(\[%clk [^\]]+\]|\[%eval [^\]]+\])\}/g, "")
                                                                            .replace(/\r/g, "");

                                                                        try {
                                                                            (game as any).loadPgn(firstClean);
                                                                        } catch (e) {
                                                                            const fenOnly = firstClean.match(/\[FEN "(.*)"\]/);
                                                                            if (fenOnly) game.load(fenOnly[1]);
                                                                        }

                                                                        await firebaseService.updateRoom(teacherId!, {
                                                                            chapters: chapters,
                                                                            activeChapterIndex: 0,
                                                                            fen: game.fen(),
                                                                            history: game.history(),
                                                                            lastMove: null,
                                                                            currentIndex: Math.max(0, game.history().length - 1),
                                                                            comment: game.getComment() || ""
                                                                        });

                                                                        toast.success(`Estudio "${study.name}" importado`, { id: loadingToast });
                                                                    } catch (e) {
                                                                        toast.error("Error al importar estudio", { id: loadingToast });
                                                                    }
                                                                }}
                                                                className="w-full p-4 bg-white/[0.03] hover:bg-gold/10 border border-white/5 hover:border-gold/30 rounded-2xl text-left transition-all group flex items-start gap-4"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center flex-shrink-0 text-white/20 group-hover:text-gold transition-colors border border-white/5">
                                                                    <BookOpen size={20} />
                                                                </div>
                                                                <div className="flex-grow min-w-0 pt-0.5">
                                                                    <h4 className="text-[11px] font-bold text-white group-hover:text-gold transition-colors truncate mb-1">
                                                                        {study.name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">{study.id}</span>
                                                                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                                                        <span className="text-[8px] font-mono text-gold/40">Lichess</span>
                                                                    </div>
                                                                </div>
                                                                <ChevronRight size={16} className="text-white/10 group-hover:text-gold group-hover:translate-x-1 transition-all self-center" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="py-12 text-center text-white/10 text-[10px] uppercase font-black tracking-widest">
                                                            No hay estudios
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center bg-black/20 rounded-3xl border border-white/10">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-8">
                                                    Conecta tu cuenta de Lichess en el perfil para ver tus estudios aquí.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {userRole === 'teacher' && (
                                    <section className="space-y-4 border-t border-white/5 pt-6 mt-4">
                                        <h3 className="text-gold font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Download size={14} /> Entrada Rápida
                                        </h3>
                                        <textarea
                                            id="pgn-input"
                                            placeholder="Pega PGN o FEN..."
                                            className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-[10px] text-white/60 focus:border-gold/30 outline-none resize-none font-mono custom-scrollbar"
                                        />
                                        <button
                                            onClick={async () => {
                                                const val = (document.getElementById('pgn-input') as HTMLTextAreaElement).value.trim();
                                                if (!val) return;
                                                const loadingToast = toast.loading("Procesando...");
                                                try {
                                                    const game = new ChessJS();
                                                    try {
                                                        (game as any).loadPgn(val);
                                                        await firebaseService.updateRoom(teacherId!, {
                                                            fen: game.fen(),
                                                            history: game.history(),
                                                            lastMove: null,
                                                            currentIndex: game.history().length - 1,
                                                            comment: game.getComment() || ""
                                                        });
                                                        toast.success("Cargado correctamente", { id: loadingToast });
                                                    } catch (e) {
                                                        await firebaseService.updateRoom(teacherId!, {
                                                            fen: val,
                                                            history: [],
                                                            lastMove: null,
                                                            currentIndex: -1,
                                                            comment: ""
                                                        });
                                                        toast.success("FEN cargado", { id: loadingToast });
                                                    }
                                                } catch (e) {
                                                    toast.error("Error en formato", { id: loadingToast });
                                                }
                                            }}
                                            className="w-full py-3.5 bg-gold text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-gold/10"
                                        >
                                            Inyectar al Tablero
                                        </button>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col animate-in fade-in duration-300">
                                <div className="flex-grow p-6 overflow-y-auto space-y-4 custom-scrollbar">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.sender === userRole ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-4 rounded-xl max-w-[85%] transition-all ${msg.sender === userRole ? 'bg-gold/10 text-white' : 'bg-white/5 text-white/80'}`}>
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2 block">
                                                    {msg.sender === 'teacher' ? 'Teacher' : 'Student'}
                                                </span>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-[#1b1a17] flex gap-3 border-t border-white/5">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Enviar mensaje..."
                                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/30 transition-all"
                                    />
                                    <button onClick={handleSendMessage} className="p-3 bg-gold text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Classroom;
