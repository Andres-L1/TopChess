import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mic, MicOff, RotateCcw } from 'lucide-react';
import Logo from '../../../components/Logo';
import toast from 'react-hot-toast';

interface ClassroomHeaderProps {
    isAudioEnabled: boolean;
    setIsAudioEnabled: (val: boolean) => void;
    userRole: string;
    teacherId: string;
    onResetStudy: () => void;
}

const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
    isAudioEnabled,
    setIsAudioEnabled,
    userRole,
    teacherId,
    onResetStudy
}) => {
    const navigate = useNavigate();

    return (
        <header className="flex-none h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between relative z-50">
            <div className="flex items-center gap-8">
                <div onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Logo />
                </div>

                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gold/5 rounded-2xl border border-gold/10">
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <span className="text-sm font-medium text-gold/80 uppercase tracking-wider">Clase en Vivo</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${isAudioEnabled
                            ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20'
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    {isAudioEnabled
                        ? <MicOff size={14} className="animate-pulse" />
                        : <Mic size={14} />}
                    {isAudioEnabled ? 'Mic ON' : 'Activar Micrófono'}
                </button>

                {userRole === 'teacher' && (
                    <button
                        onClick={onResetStudy}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl border border-white/5 transition-all"
                        title="Reiniciar Tablero"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}

                <div className="h-8 w-px bg-white/10 mx-2" />

                <button
                    onClick={() => {
                        toast.success('Clase finalizada');
                        navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all group"
                >
                    <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Salir
                </button>
            </div>
        </header>
    );
};

export default ClassroomHeader;
