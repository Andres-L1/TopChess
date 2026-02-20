import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { User, GraduationCap, ArrowRight } from 'lucide-react';
import TeacherRegistrationForm from '../components/TeacherRegistrationForm';
import StudentRegistrationForm from '../components/StudentRegistrationForm';

const Onboarding = () => {
    const { userRole } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<'selection' | 'student_form' | 'teacher_form'>('selection');

    React.useEffect(() => {
        if (userRole === 'teacher') navigate('/dashboard');
        if (userRole === 'student') navigate('/student-dashboard');
    }, [userRole, navigate]);

    const handleStudentComplete = () => {
        navigate('/student-dashboard');
    };

    const handleTeacherComplete = () => {
        navigate('/dashboard');
    };

    if (view === 'student_form') {
        return (
            <div className="min-h-screen bg-[#161512] py-12 px-4">
                <button
                    onClick={() => setView('selection')}
                    className="fixed top-24 left-4 md:left-8 text-white/50 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← Volver
                </button>
                <StudentRegistrationForm onComplete={handleStudentComplete} />
            </div>
        );
    }

    if (view === 'teacher_form') {
        return (
            <div className="min-h-screen bg-[#161512] py-12 px-4">
                <button
                    onClick={() => setView('selection')}
                    className="fixed top-24 left-4 md:left-8 text-white/50 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← Volver
                </button>
                <TeacherRegistrationForm onComplete={handleTeacherComplete} />
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
                    onClick={() => setView('student_form')}
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
                    onClick={() => setView('teacher_form')}
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
