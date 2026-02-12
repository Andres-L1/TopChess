import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { MessageCircle, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const MatchResult = ({ teacher, onSlid, onClose }) => {
    const navigate = useNavigate();

    const handleConnect = () => {
        // Create request and go to chat
        // We'll simulate a student ID for now
        const studentId = 'guest_student';
        mockDB.createRequest(studentId, teacher.id, "Hi! I matched with you based on my goals.");
        toast.success(`Conexión solicitada con ${teacher.name}`);
        navigate(`/chat/${teacher.id}`);
    };

    if (!teacher) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
            <div className="w-full max-w-md bg-dark-panel border border-gold/30 rounded-3xl shadow-[0_0_100px_rgba(212,175,55,0.2)] overflow-hidden relative flex flex-col items-center text-center">

                {/* Confetti / Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-black pointer-events-none"></div>

                <div className="p-8 relative z-10 w-full">
                    <div className="inline-block bg-gold text-black text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 shadow-lg animate-bounce">
                        It's a Match!
                    </div>

                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
                        {teacher.name}
                    </h2>
                    <div className="text-gold font-bold uppercase tracking-widest text-sm mb-6">
                        {teacher.title} • {teacher.elo} ELO
                    </div>

                    {/* No Photo - Focus on Curriculum/Style */}
                    <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/5 text-left">
                        <div className="mb-4">
                            <h4 className="text-gold text-xs font-bold uppercase mb-2">Estilo de Enseñanza</h4>
                            <p className="text-gray-300 text-sm leading-relaxed italic">
                                "{teacher.teachingStyle}"
                            </p>
                        </div>

                        <div>
                            <h4 className="text-gold text-xs font-bold uppercase mb-2">Plan de Estudios</h4>
                            <p className="text-gray-400 text-xs">
                                {teacher.curriculum}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-center mb-8">
                        {teacher.tags && teacher.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-white/5">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleConnect}
                            className="w-full bg-gold hover:bg-gold-hover text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                        >
                            <MessageCircle size={18} />
                            <span>Contactar / Empezar</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-transparent hover:bg-white/5 text-gray-500 hover:text-white py-3 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                            Seguir Buscando
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchResult;
