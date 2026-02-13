import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import { Send, CheckCircle, Clock, Lock, DollarSign } from 'lucide-react';
import { Message, Profile, Request } from '../types/index';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { userRole, currentUserId } = useAuth();
    const navigate = useNavigate();

    const targetId = teacherId!;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<Request['status'] | null>(null);
    const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Payment State
    const [showPayModal, setShowPayModal] = useState(false);
    const [payAmount, setPayAmount] = useState(59); // Default current price
    const [isProcessingPay, setIsProcessingPay] = useState(false);

    // Initial Load
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initChat = async () => {
            try {
                // 1. Get Profile
                const profile = await firebaseService.getPublicProfile(targetId);
                setTargetProfile(profile);

                // 2. Determine Request Status
                const reqStatus = await firebaseService.getRequestStatus(
                    userRole === 'student' ? currentUserId : targetId,
                    userRole === 'student' ? targetId : currentUserId
                );
                setStatus(reqStatus);

                // 3. Subscribe to Chat
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
                sender: userRole || 'student',
                timestamp: Date.now(),
                type: 'text'
            };

            if (userRole === 'student' && !status) {
                // Create Request on first message if no status
                await firebaseService.createRequest({
                    id: `req_${Date.now()}`,
                    studentId: currentUserId,
                    teacherId: targetId,
                    status: 'pending',
                    timestamp: Date.now(),
                    message: inputText
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
                // Send notification message
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

    if (!targetProfile) return <div className="p-8 text-center text-white">Cargando perfil...</div>;

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-100px)] flex flex-col pt-4 px-4 sm:px-0 animate-fade-in">
            {/* Header / Status Banner */}
            <div className="bg-[#262421] border border-[#302e2b] rounded-t-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <img src={targetProfile.image} alt={targetProfile.name} className="w-12 h-12 rounded-full object-cover border border-[#403d39]" />
                    <div className="hidden sm:block">
                        <h2 className="font-bold text-white text-lg leading-tight">{targetProfile.name}</h2>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#8b8982]">
                            {userRole === 'student' ? 'Profesor' : 'Estudiante'} • ELO {targetProfile.elo}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {userRole === 'student' && status === 'approved' && (
                        <button
                            onClick={() => setShowPayModal(true)}
                            className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 text-xs transition-all active:scale-95"
                        >
                            <DollarSign size={14} /> Pagar
                        </button>
                    )}

                    {status === 'approved' && (
                        <button
                            onClick={() => navigate(userRole === 'student' ? `/classroom/${targetId}` : `/classroom/${currentUserId}`)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 text-xs transition-all shadow-lg active:scale-95"
                        >
                            <CheckCircle size={14} /> Ir al Aula
                        </button>
                    )}
                    {status === 'pending' && (
                        <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 font-bold">
                            <Clock size={14} /> Pendiente
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow bg-[#161512]/80 border-x border-[#302e2b] p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center text-[#666] mt-10 space-y-2">
                        <p className="text-sm">
                            {userRole === 'student'
                                ? `Cuéntale a ${targetProfile.name} por qué quieres aprender ajedrez.`
                                : `Inicio del chat con ${targetProfile.name}.`}
                        </p>
                        <div className="w-12 h-0.5 bg-white/5 mx-auto"></div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${msg.sender === userRole
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-[#262421] text-text-secondary border border-white/5 rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                                <span className={`text-[9px] block text-right mt-1 opacity-60`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#262421] border border-[#302e2b] rounded-b-2xl p-4 flex gap-3 shadow-2xl">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={status === 'approved' ? "Escribe un mensaje..." : "Escribe para presentarte..."}
                    className="flex-grow bg-[#1a1917] border border-white/5 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-gold/50 transition-all placeholder:text-[#444]"
                />
                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="bg-gold text-black p-2 rounded-xl hover:bg-gold-hover disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-95"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#262421] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-enter">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-gold" />
                                Pagar Mensualidad
                            </h3>
                            <p className="text-sm text-[#8b8982] mt-1">Suscripción: {targetProfile.name}</p>
                        </div>
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="text-[#8b8982] text-xs uppercase font-bold tracking-widest mb-1">Monto a pagar</div>
                                <div className="text-5xl font-black text-white">{payAmount}€</div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessingPay}
                                    className="w-full py-4 bg-gold text-black font-black rounded-2xl hover:bg-white transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-2"
                                >
                                    {isProcessingPay ? 'Procesando...' : 'Confirmar Pago'}
                                </button>
                                <button onClick={() => setShowPayModal(false)} className="w-full py-3 text-[#8b8982] hover:text-white font-bold text-sm transition-colors">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
