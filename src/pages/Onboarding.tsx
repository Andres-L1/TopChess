import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { User, GraduationCap, ArrowRight } from 'lucide-react';
import MatchWizard from '../components/MatchWizard';
import StudentWizard from '../components/StudentWizard';
import toast from 'react-hot-toast';

const Onboarding = () => {
    const { currentUser, setUserRole } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<'selection' | 'student_wizard' | 'teacher_wizard'>('selection');

    const handleStudentSelect = () => {
        setView('student_wizard');
    };

    const handleStudentWizardComplete = () => {
        navigate('/student-dashboard');
    };

    const handleTeacherSelect = () => {
        setView('teacher_wizard');
    };

    const handleWizardComplete = () => {
        setUserRole('teacher');
        navigate('/dashboard');
    };

    if (view === 'student_wizard') {
        return (
            <div className="min-h-screen bg-[#161512] flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <StudentWizard onComplete={handleStudentWizardComplete} />
                </div>
            </div>
        );
    }

    if (view === 'teacher_wizard') {
        return (
            <div className="min-h-screen bg-[#161512] flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <MatchWizard onComplete={handleWizardComplete} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#161512] flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                Bienvenido a <span className="text-gold">TopChess</span>
            </h1>
            <p className="text-[#8b8982] text-lg mb-12 max-w-md mx-auto animate-fade-in delay-100">
                Para comenzar, cuéntanos cómo te gustaría usar la plataforma.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl animate-enter delay-200">
                {/* Student Card */}
                <button
                    onClick={handleStudentSelect}
                    className="group bg-[#262421] hover:bg-[#302e2b] border border-white/5 hover:border-gold/30 rounded-2xl p-8 transition-all flex flex-col items-center gap-6 text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <GraduationCap size={120} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Quiero Aprender</h3>
                        <p className="text-[#8b8982] text-sm">
                            Busco profesores, quiero tomar clases y mejorar mi nivel de ajedrez.
                        </p>
                    </div>
                    <div className="mt-auto w-full flex items-center justify-between text-blue-400 font-bold text-sm">
                        <span>Continuar como Estudiante</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>

                {/* Teacher Card */}
                <button
                    onClick={handleTeacherSelect}
                    className="group bg-[#262421] hover:bg-[#302e2b] border border-white/5 hover:border-gold/30 rounded-2xl p-8 transition-all flex flex-col items-center gap-6 text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <User size={120} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <User size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Quiero Enseñar</h3>
                        <p className="text-[#8b8982] text-sm">
                            Soy profesor o jugador experto y quiero ofrecer clases a estudiantes.
                        </p>
                    </div>
                    <div className="mt-auto w-full flex items-center justify-between text-gold font-bold text-sm">
                        <span>Crear Perfil de Profesor</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
