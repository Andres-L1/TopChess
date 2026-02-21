import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import { Send, CheckCircle, Clock, DollarSign, ChevronLeft } from 'lucide-react';
import { Message, Profile, Request } from '../types/index';
import toast from 'react-hot-toast';
import PremiumButton from '../components/PremiumButton';
import { motion, AnimatePresence } from 'framer-motion';

const Chat: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { userRole, currentUserId, currentUser } = useAuth();
    const navigate = useNavigate();

    const targetId = teacherId!;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<Request['status'] | null>(null);
    const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Payment State
    const [showPayModal, setShowPayModal] = useState(false);
    const [payAmount] = useState(59);
    const [isProcessingPay, setIsProcessingPay] = useState(false);

    // Initial Load
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initChat = async () => {
            try {
                const profile = await firebaseService.getPublicProfile(targetId);
                setTargetProfile(profile);

                const reqStatus = await firebaseService.getRequestStatus(
                    userRole === 'student' ? currentUserId : targetId,
                    userRole === 'student' ? targetId : currentUserId
                );
                setStatus(reqStatus);

                const uid1 = userRole === 'student' ? currentUserId : targetId;
                const uid2 = userRole === 'student' ? targetId : currentUserId;

                unsubscribe = firebaseService.subscribeToChat(uid1, uid2, (msgs) => {
                    setMessages(msgs);
                });
            } catch (error) {
                console.error("Chat init error", error);
            }
        };

        if (currentUserId && targetId) {
            initChat();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [targetId, currentUserId, userRole]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        try {
            const msg: Omit<Message, 'id'> = {
                studentId: userRole === 'student' ? currentUserId : targetId,
                teacherId: userRole === 'student' ? targetId : currentUserId,
                text: inputText,
                sender: (userRole as any) || 'student',
                timestamp: Date.now(),
                type: 'text'
            };

            if (userRole === 'student' && !status) {
                await firebaseService.createRequest({
                    id: `req_${Date.now()}`,
                    studentId: currentUserId,
                    studentName: currentUser?.displayName || 'Estudiante',
                    teacherId: targetId,
                    status: 'pending',
                    timestamp: Date.now()
                });
                setStatus('pending');
            }

            await firebaseService.sendMessage(msg);
            setInputText("");
        } catch (error) {
            toast.error("Error al enviar mensaje");
        }
    };

    const handlePayment = async () => {
        setIsProcessingPay(true);
        try {
            const result = await firebaseService.processPayment(currentUserId, targetId, payAmount);

            if (result.success) {
                toast.success(result.message);
                setShowPayModal(false);

                const month = new Date().toLocaleString('es-ES', { month: 'long' });
                await firebaseService.sendMessage({
                    studentId: currentUserId,
                    teacherId: targetId,
                    text: `💰 He pagado la mensualidad de ${month} (${payAmount}€)`,
                    sender: 'student',
                    timestamp: Date.now(),
                    type: 'payment_request'
                });
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error("Payment error", error);
            toast.error("Error al procesar el pago");
        } finally {
            setIsProcessingPay(false);
        }
    };

    if (!targetProfile) return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg text-gold">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col pt-4 md:pt-8 px-2 md:px-4 animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-t-3xl p-4 flex items-center justify-between shadow-2xl z-10">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 md:p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="relative flex-shrink-0">
                        <img src={targetProfile.image} alt={targetProfile.name} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover border border-white/10 shadow-lg" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-[#161512] rounded-full shadow-lg"></div>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-white text-sm md:text-lg leading-tight tracking-tight truncate">{targetProfile.name}</h2>
                        <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-[#8b8982] truncate">
                                {userRole === 'student' ? 'Profesor' : 'Alumno'}
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-gold/80 flex-shrink-0">
                                ELO {targetProfile.elo}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-3 ml-2">
                    {userRole === 'student' && status === 'approved' && (
                        <PremiumButton
                            variant="gold"
                            size="sm"
                            onClick={() => setShowPayModal(true)}
                            icon={DollarSign}
                            className="!px-2 md:!px-4 !py-1 text-[10px] md:text-xs"
                        >
                            <span className="hidden sm:inline">Pagar</span>
                        </PremiumButton>
                    )}

                    {status === 'approved' && (
                        <PremiumButton
                            variant="white"
                            size="sm"
                            onClick={() => navigate(userRole === 'student' ? `/classroom/${targetId}` : `/classroom/${currentUserId}`)}
                            icon={CheckCircle}
                            className="!px-2 md:!px-4 !py-1 text-[10px] md:text-xs"
                        >
                            Aula
                        </PremiumButton>
                    )}

                    {status === 'pending' && (
                        <div className="px-2 md:px-4 py-1.5 md:py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-2 shadow-inner">
                            <Clock size={10} className="md:w-3 md:h-3" strokeWidth={3} /> <span className="hidden xs:inline">{userRole === 'student' ? 'Esperando' : 'Pendiente'}</span><span className="xs:hidden">...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow bg-black/20 backdrop-blur-sm border-x border-white/5 p-6 overflow-y-auto space-y-6 custom-scrollbar scroll-smooth">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                        <div className="p-6 rounded-full bg-white/5 border border-white/5">
                            <Send size={40} strokeWidth={1} className="text-white/30" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white max-w-[200px]">
                                {userRole === 'student'
                                    ? `Cuéntale a ${targetProfile.name} por qué quieres aprender ajedrez.`
                                    : `Inicio del chat con ${targetProfile.name}.`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {messages.map((msg, i) => {
                                const isMe = msg.sender === userRole;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        key={msg.id || i}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`group relative max-w-[85%] md:max-w-[70%] px-5 py-3 shadow-lg transition-all duration-300 ${isMe
                                            ? 'bg-gradient-to-br from-gold/90 to-gold text-black rounded-3xl rounded-tr-sm'
                                            : 'bg-[#1a1917]/80 backdrop-blur-md text-white border border-white/5 rounded-3xl rounded-tl-sm'
                                            }`}>
                                            <p className={`text-[13px] md:text-sm leading-relaxed font-medium whitespace-pre-wrap ${isMe ? 'text-black/90' : 'text-white/90'}`}>{msg.text}</p>
                                            <div className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 ${isMe ? 'opacity-60 justify-end text-black' : 'opacity-40 justify-start text-white'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && <CheckCircle size={10} />}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#111]/90 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-b-3xl p-3 md:p-4 flex gap-2 md:gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] mt-2 mx-1 md:mx-0 mb-4 md:mb-0">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={status === 'approved' ? "Escribe un mensaje..." : "Escribe para presentarte..."}
                        className="input-premium text-[13px] md:text-sm py-3 md:py-3.5 shadow-inner"
                    />
                </div>
                <PremiumButton
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="!rounded-xl shadow-xl shadow-gold/10 px-3 md:px-6"
                    icon={Send}
                >
                    <span className="hidden sm:inline font-bold">Enviar</span>
                </PremiumButton>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPayModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1917] w-full max-w-sm rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden"
                        >
                            <div className="p-8 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                                <div className="w-20 h-20 bg-gold/10 rounded-[30px] border border-gold/30 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-gold/5">
                                    <DollarSign size={40} className="text-gold" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Suscripción Premium</h3>
                                <p className="text-sm font-bold text-text-muted mt-2 uppercase tracking-widest">{targetProfile.name}</p>
                            </div>

                            <div className="p-10">
                                <div className="text-center mb-10">
                                    <div className="text-5xl font-black text-white flex items-center justify-center gap-1">
                                        {payAmount}
                                        <span className="text-2xl text-gold font-light">€</span>
                                    </div>
                                    <p className="text-xs font-bold text-[#8b8982] mt-2 uppercase tracking-[0.2em]">Pago Mensual</p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <PremiumButton
                                        onClick={handlePayment}
                                        disabled={isProcessingPay}
                                        className="w-full !rounded-[24px] !py-5 shadow-2xl shadow-gold/20"
                                        size="lg"
                                    >
                                        {isProcessingPay ? 'Procesando...' : 'Confirmar Pago'}
                                    </PremiumButton>
                                    <button
                                        onClick={() => setShowPayModal(false)}
                                        className="w-full py-4 text-[#666] hover:text-white font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chat;

