import React, { useState } from 'react';
import { BookOpen, MessageSquare, Plus, ChevronRight, Hash, Brain, Sword, Trophy } from 'lucide-react';
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
    roomChapters: any[];
    activeChapterIndex: number;
    onLoadChapter: (idx: number) => Promise<void>;
    currentComment: string;
    lichessStudies: any[];
    onImportStudy: (id: string, name: string) => Promise<void>;
    teacherProfile: Teacher | null;
    onInjectPgnFen: (val: string) => Promise<void>;
    onMoveClick: (index: number) => void;
    comments?: Record<number, string>;
}

const ClassroomSidebar: React.FC<ClassroomSidebarProps> = ({
    isSidePanelOpen,
    messages,
    userRole,
    onSendMessage,
    gameState,
    roomChapters,
    activeChapterIndex,
    onLoadChapter,
    currentComment,
    lichessStudies,
    onImportStudy,
    teacherProfile,
    onInjectPgnFen,
    onMoveClick,
    comments
}) => {
    const [activeTab, setActiveTab] = useState<'moves' | 'chapters' | 'chat'>('moves');
    const [studyId, setStudyId] = useState('');
    const [studyName, setStudyName] = useState('');
    const [pgnInput, setPgnInput] = useState('');

    if (!isSidePanelOpen) return null;

    return (
        <aside className="flex-none w-full lg:w-[320px] xl:w-[360px] bg-[#1b1a17] border-l border-white/5 flex flex-col min-h-0 overflow-hidden">

            {/* ── Tab navigation (Lichess style: Moves / Chapters / Chat) */}
            <div className="flex-none flex border-b border-white/5">
                {[
                    { id: 'moves' as const, icon: Sword, label: 'Jugadas' },
                    { id: 'chapters' as const, icon: BookOpen, label: 'Capítulos' },
                    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-gold text-gold bg-gold/5'
                            : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={12} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab content ─────────────────────────────────────────────── */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">

                {/* MOVES TAB ─ main panel, Lichess style */}
                {activeTab === 'moves' && (
                    <div className="flex flex-col h-full">
                        {/* Material captured (compact, above move list like Lichess) */}
                        <div className="flex-none px-4 pt-3 pb-1 border-b border-white/5">
                            <CapturedPieces fen={gameState.fen} orientation={gameState.orientation || 'white'} />
                        </div>

                        {/* Move list */}
                        <div className="flex-grow min-h-0 overflow-y-auto">
                            <MoveHistory
                                moves={gameState.history}
                                currentIndex={gameState.currentIndex}
                                onMoveClick={onMoveClick}
                                currentComment={currentComment}
                                comments={comments}
                            />
                        </div>

                        {/* Comment callout (if active position has a comment) */}
                        {currentComment && (
                            <div className="flex-none p-4 border-t border-white/5 bg-black/20">
                                <div className="flex items-start gap-3">
                                    <Brain size={14} className="text-gold mt-0.5 shrink-0" />
                                    <p className="text-xs text-white/70 italic leading-relaxed">
                                        {currentComment}
                                    </p>
                                </div>
                            </div>
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
                                        onClick={async () => { await onInjectPgnFen(pgnInput); setPgnInput(''); }}
                                        className="px-3 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest border border-gold/20 transition-all self-end"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAPTERS TAB */}
                {activeTab === 'chapters' && (
                    <div className="p-4 space-y-6">
                        {/* Chapter list */}
                        {roomChapters.length > 0 && (
                            <section className="space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                    <Hash size={10} /> Capítulos de la Clase
                                </p>
                                <div className="grid gap-1">
                                    {roomChapters.map((ch, idx) => (
                                        <button
                                            key={idx}
                                            disabled={userRole !== 'teacher'}
                                            onClick={() => onLoadChapter(idx)}
                                            className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${activeChapterIndex === idx
                                                ? 'bg-gold text-black border-gold'
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
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold/50 outline-none placeholder:text-white/10 transition-all"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={studyId}
                                            onChange={e => setStudyId(e.target.value)}
                                            placeholder="ID del estudio"
                                            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold/50 outline-none placeholder:text-white/10 font-mono transition-all"
                                        />
                                        <button
                                            onClick={() => { onImportStudy(studyId, studyName); setStudyId(''); setStudyName(''); }}
                                            className="px-4 bg-gold hover:bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Importar
                                        </button>
                                    </div>
                                </div>

                                {/* Quick access from profile */}
                                {teacherProfile?.lichessAccessToken && lichessStudies.length > 0 && (
                                    <div className="pt-2 border-t border-white/5 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Mis estudios</p>
                                        {lichessStudies.slice(0, 8).map(study => (
                                            <button
                                                key={study.id}
                                                onClick={() => onImportStudy(study.id, study.name)}
                                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/5 text-left text-xs text-white/50 hover:text-gold transition-all flex items-center gap-2 group"
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

export default ClassroomSidebar;
