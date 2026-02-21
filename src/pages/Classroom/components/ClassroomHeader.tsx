import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mic, MicOff, RotateCcw } from 'lucide-react';
import Logo from '../../../components/Logo';
import toast from 'react-hot-toast';

interface ClassroomHeaderProps {
    isAudioEnabled: boolean;
    setIsAudioEnabled: (val: boolean) => void;
    isConnected: boolean;
    isMuted: boolean;
    toggleMute: () => void;
    userRole: string;
    teacherId: string;
    teacherName?: string;
    onResetStudy: () => void;
}

const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
    isAudioEnabled,
    setIsAudioEnabled,
    isConnected,
    isMuted,
    toggleMute,
    userRole,
    teacherId,
    teacherName,
    onResetStudy
}) => {
    const navigate = useNavigate();

    return (
        <header className="flex-none h-14 md:h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 flex items-center justify-between relative z-50">
            <div className="flex items-center gap-4 md:gap-8">
                <div onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="md:hidden">
                        {/* Mobile Logo (Icon Only) */}
                        <Logo className="w-8 h-8 text-gold" />
                    </div>
                    <div className="hidden md:block">
                        <Logo />
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gold/5 rounded-2xl border border-gold/10">
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <span className="text-sm font-medium text-gold/80 uppercase tracking-wider">
                        {userRole === 'student' && teacherName ? `Aula de ${teacherName}` : 'Clase en Vivo'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                    {/* Main Mic Button: Connects or Toggles Mute */}
                    <button
                        onClick={() => {
                            if (!isAudioEnabled) {
                                setIsAudioEnabled(true);
                                toast("Solicitando permisos de micrófono...", { icon: '🎙️' });
                            } else if (isConnected) {
                                toggleMute();
                            }
                        }}
                        className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isAudioEnabled && isConnected && !isMuted
                            ? 'bg-gold text-black shadow-gold/20'
                            : 'bg-transparent text-white/40 hover:text-white'
                            }`}
                    >
                        {isAudioEnabled && isConnected
                            ? (isMuted ? <MicOff size={14} /> : <Mic size={14} />)
                            : <MicOff size={14} />
                        }
                        <span className="hidden md:inline">
                            {!isAudioEnabled ? 'Activar Audio' : (isConnected ? (isMuted ? 'Unmute' : 'Mute') : 'Conectando...')}
                        </span>
                    </button>

                    {/* Disconnect Button (only if audio enabled) */}
                    {isAudioEnabled && (
                        <button
                            onClick={() => setIsAudioEnabled(false)}
                            className="p-2 ml-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Desconectar Audio"
                        >
                            <LogOut size={12} />
                        </button>
                    )}
                </div>

                {userRole === 'teacher' && (
                    <button
                        onClick={onResetStudy}
                        className="p-2 md:p-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl border border-white/5 transition-all"
                        title="Reiniciar Tablero"
                    >
                        <RotateCcw size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                )}

                <div className="h-6 md:h-8 w-px bg-white/10 mx-1 md:mx-2" />

                <button
                    onClick={async () => {
                        if (userRole === 'teacher') {
                            try {
                                const { firebaseService } = await import('../../../services/firebaseService');
                                await firebaseService.resetRoom(teacherId);
                            } catch (e) {
                                console.error("Could not reset room on exit:", e);
                            }
                        }
                        toast.success('Clase finalizada');
                        navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard');
                    }}
                    className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all group"
                >
                    <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden md:inline">Salir</span>
                </button>
            </div>
        </header>
    );
};

export default React.memo(ClassroomHeader);
