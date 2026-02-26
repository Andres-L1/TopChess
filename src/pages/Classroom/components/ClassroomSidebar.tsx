import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen, MessageSquare, Plus, ChevronRight,
    Hash, Brain, Sword, Trophy, Download, Loader2
} from 'lucide-react';
import MoveHistory from '../../../components/MoveHistory';
import CapturedPieces from '../../../components/CapturedPieces';
import ClassroomChat from './ClassroomChat';
import { Message, GameState, Teacher } from '../../../types/index';

interface ClassroomSidebarProps {
    isSidePanelOpen: boolean;
    messages: Message[];
    userRole: string;
    onSendMessage: (text: string) => void;
    gameState: GameState;
    roomChapters: { name: string, pgn: string }[];
    activeStudyName: string;
    activeChapterIndex: number;
    onLoadChapter: (idx: number) => Promise<void>;
    currentComment: string;
    lichessStudies: { id: string, name: string }[];
    onImportStudy: (id: string, name: string) => Promise<void>;
    teacherProfile: Teacher | null;
    onInjectPgnFen: (val: string) => Promise<void>;
    onMoveClick: (index: number) => void;
    comments?: Record<number, string>;
    onExportPgn: () => void;
}

const ClassroomSidebar: React.FC<ClassroomSidebarProps> = ({
    isSidePanelOpen,
    messages,
    userRole,
    onSendMessage,
    gameState,
    roomChapters,
    activeStudyName,
    activeChapterIndex,
    onLoadChapter,
    currentComment,
    lichessStudies,
    onImportStudy,
    teacherProfile,
    onInjectPgnFen,
    onMoveClick,
    comments,
    onExportPgn
}) => {
    const [activeTab, setActiveTab] = useState<'moves' | 'chapters' | 'chat'>('moves');
    const [studyId, setStudyId] = useState('');
    const [studyName, setStudyName] = useState('');
    const [pgnInput, setPgnInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isInjecting, setIsInjecting] = useState(false);

    // Unread message tracking
    const [unreadCount, setUnreadCount] = useState(0);
    const prevMsgCount = useRef(messages.length);

    useEffect(() => {
        if (activeTab === 'chat') {
            setUnreadCount(0);
            prevMsgCount.current = messages.length;
        } else {
            const newMsgs = messages.length - prevMsgCount.current;
            if (newMsgs > 0) setUnreadCount(c => c + newMsgs);
            prevMsgCount.current = messages.length;
        }
    }, [messages.length, activeTab]);

    if (!isSidePanelOpen) return null;

    const handleImport = async () => {
        if (!studyId.trim()) return;
        setIsImporting(true);
        try {
            await onImportStudy(studyId, studyName || studyId);
            setStudyId('');
            setStudyName('');
        } finally {
            setIsImporting(false);
        }
    };

    const handleInject = async () => {
        if (!pgnInput.trim()) return;
        setIsInjecting(true);
        try {
            await onInjectPgnFen(pgnInput);
            setPgnInput('');
        } finally {
            setIsInjecting(false);
        }
    };

    return (
        <aside className="flex-none w-full h-full liquid-glass-dark border-l border-white/10 flex flex-col min-h-0 overflow-hidden">

            {/* ── Tab navigation */}
            <div className="flex-none flex border-b border-white/5">
                {[
                    { id: 'moves' as const, icon: Sword, label: 'Jugadas' },
                    { id: 'chapters' as const, icon: BookOpen, label: 'Capítulos' },
                    { id: 'chat' as const, icon: MessageSquare, label: 'Chat', badge: unreadCount },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-gold text-gold liquid-glass-subtle liquid-glow'
                            : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <div className="relative">
                            <tab.icon size={12} />
                            {tab.badge && tab.badge > 0 && (
                                <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center text-white shadow-sm">
                                    {tab.badge > 9 ? '9+' : tab.badge}
                                </span>
                            )}
                        </div>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab content */}
            <div className="flex-1 min-h-0 flex flex-col">

                {/* MOVES TAB */}
                {activeTab === 'moves' && (
                    <div className="flex-1 min-h-0 flex flex-col">
                        {/* Captured pieces */}
                        <div className="flex-none px-4 pt-3 pb-1 border-b border-white/5">
                            <CapturedPieces fen={gameState.fen} orientation={gameState.orientation || 'white'} />
                        </div>

                        {/* Move list */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                            <MoveHistory
                                moves={gameState.history}
                                currentIndex={gameState.currentIndex}
                                onMoveClick={onMoveClick}
                                currentComment={currentComment}
                                comments={comments}
                            />
                        </div>

                        {/* Active comment panel — shows text for the highlighted move */}
                        {currentComment ? (
                            <div className="flex-none p-4 border-t border-white/5 bg-black/20">
                                <div className="flex items-start gap-3">
                                    <Brain size={14} className="text-gold mt-0.5 shrink-0" />
                                    <p className="text-xs text-white/70 italic leading-relaxed">{currentComment}</p>
                                </div>
                            </div>
                        ) : (
                            /* Reserve space so move list doesn't jump */
                            <div className="flex-none h-1 border-t border-white/5" />
                        )}

                        {/* PGN/FEN inject (teacher only) */}
                        {userRole === 'teacher' && (
                            <div className="flex-none p-4 pt-3 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 flex items-center gap-1.5">
                                    <Plus size={10} /> Inyectar PGN / FEN
                                </p>
                                <div className="flex gap-2">
                                    <textarea
                                        value={pgnInput}
                                        onChange={e => setPgnInput(e.target.value)}
                                        placeholder="PGN o FEN..."
                                        rows={3}
                                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold/50 outline-none custom-scrollbar resize-none placeholder:text-white/10 font-mono transition-all"
                                    />
                                    <button
                                        onClick={handleInject}
                                        disabled={!pgnInput.trim() || isInjecting}
                                        className="px-3 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest border border-gold/20 transition-all self-end disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        {isInjecting ? <Loader2 size={10} className="animate-spin" /> : 'OK'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAPTERS TAB */}
                {activeTab === 'chapters' && (
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Active study name */}
                        {activeStudyName && (
                            <div className="px-3 py-1.5 bg-gold/5 border border-gold/20 rounded-lg">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gold/60 truncate">{activeStudyName}</p>
                            </div>
                        )}

                        {/* Chapter list */}
                        {roomChapters.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                        <Hash size={10} /> Capítulos de la Clase
                                    </p>
                                    {userRole === 'teacher' && (
                                        <button
                                            onClick={onExportPgn}
                                            className="px-2 py-1 bg-white/5 hover:bg-gold/20 text-white/50 hover:text-gold rounded text-[8px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-1 transition-all"
                                        >
                                            <Download size={10} /> Exportar
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-1">
                                    {roomChapters.map((ch, idx) => (
                                        <button
                                            key={idx}
                                            disabled={userRole !== 'teacher'}
                                            onClick={() => onLoadChapter(idx)}
                                            className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${activeChapterIndex === idx
                                                ? 'liquid-glass text-gold border-gold/40 shadow-lg'
                                                : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-5 h-5 rounded text-[9px] font-black flex items-center justify-center shrink-0 ${activeChapterIndex === idx ? 'bg-black/20' : 'bg-white/10'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">{ch.name}</span>
                                            </div>
                                            {activeChapterIndex === idx && <ChevronRight size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Import from Lichess (teacher only) */}
                        {userRole === 'teacher' && (
                            <section className="space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                    <BookOpen size={10} /> Importar de Lichess
                                </p>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={studyName}
                                        onChange={e => setStudyName(e.target.value)}
                                        placeholder="Nombre del estudio"
                                        className="input-premium px-3 py-2.5 text-xs"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={studyId}
                                            onChange={e => setStudyId(e.target.value)}
                                            placeholder="ID del estudio"
                                            className="input-premium flex-grow px-3 py-2.5 text-xs font-mono"
                                        />
                                        <button
                                            onClick={handleImport}
                                            disabled={!studyId.trim() || isImporting}
                                            className="btn-primary px-4 py-2.5 text-[9px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        >
                                            {isImporting ? <Loader2 size={11} className="animate-spin" /> : null}
                                            Importar
                                        </button>
                                    </div>
                                </div>

                                {/* Quick access from Lichess profile */}
                                {teacherProfile?.lichessAccessToken && lichessStudies.length > 0 && (
                                    <div className="pt-2 border-t border-white/5 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Mis estudios</p>
                                        {lichessStudies.slice(0, 8).map(study => (
                                            <button
                                                key={study.id}
                                                onClick={() => onImportStudy(study.id, study.name)}
                                                className="w-full px-3 py-2.5 rounded-xl liquid-glass-subtle border border-white/5 hover:border-gold/30 hover:shadow-gold/10 text-left text-xs text-white/50 hover:text-gold transition-all flex items-center gap-2 group"
                                            >
                                                <Plus size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                <span className="truncate">{study.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {roomChapters.length === 0 && userRole !== 'teacher' && (
                            <div className="text-center py-16">
                                <Trophy size={24} className="text-white/10 mx-auto mb-3" />
                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Sin capítulos aún</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <ClassroomChat
                        messages={messages}
                        userRole={userRole}
                        onSendMessage={onSendMessage}
                    />
                )}
            </div>
        </aside>
    );
};

export default React.memo(ClassroomSidebar);
