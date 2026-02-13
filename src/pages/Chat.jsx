import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { Send, CheckCircle, Clock, Lock, DollarSign } from 'lucide-react';

const Chat = () => {
    const { teacherId } = useParams(); // URL param name is 'teacherId' defined in routes, but can be studentId if teacher is viewing
    const { userRole, currentUserId } = React.useContext(AuthContext);
    const navigate = useNavigate();

    // Determine who we are talking to based on role
    // If I am Student -> I am talking to Teacher (ID in URL)
    // If I am Teacher -> I am talking to Student (ID in URL)
    const targetId = teacherId;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState(null); // null, pending, approved
    const [targetProfile, setTargetProfile] = useState(null);
    const messagesEndRef = useRef(null);

    // Payment State
    const [showPayModal, setShowPayModal] = useState(false);
    const [payAmount, setPayAmount] = useState(20);

    // Initial Load
    useEffect(() => {
        let profile = null;
        let reqStatus = null;

        if (userRole === 'student') {
            // Student View: Target is Teacher
            profile = mockDB.getTeacherById(targetId);
            reqStatus = mockDB.getRequestStatus(currentUserId, targetId);
            setMessages(mockDB.getMessages(currentUserId, targetId));

            // Subscribe
            const unsubscribe = mockDB.subscribeToChat(currentUserId, targetId, (msgs) => {
                setMessages(msgs);
                setStatus(mockDB.getRequestStatus(currentUserId, targetId));
            });
            setTargetProfile(profile);
            setStatus(reqStatus);
            return () => unsubscribe();

        } else {
            // Teacher View: Target is Student
            // Since we don't have a specific 'students' DB, we extract info from requests
            // The URL param 'teacherId' is actually the studentId here
            const studentId = targetId;
            const requests = mockDB.getRequestsForTeacher(currentUserId);
            // Note: getRequestsForTeacher only returns pending. We need to check all requests or approval status manually if not pending.
            // For MVP, lets try to find the student in approvals or create a mock profile

            // Mock profile for student since we don't have a Users DB
            profile = {
                id: studentId,
                name: `Estudiante ${studentId}`, // Fallback name
                image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200", // Generic avatar
            };

            // Check status (Teacher checking student status)
            // We need a helper to check status given a teacher AND student
            // For now, assume if we are here, we are approved or checking a request
            // We can't easily get status accurately without a new DB method "getRequest(studentId, teacherId)"

            // Let's assume 'approved' for chat visibility if accessed via "My Students"
            // If accessing via "Requests", it might be pending.

            // Correct way:
            const allRequests = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
            const req = allRequests.find(r => r.studentId === studentId && r.teacherId === currentUserId);
            reqStatus = req ? req.status : null;

            setMessages(mockDB.getMessages(studentId, currentUserId));

            const unsubscribe = mockDB.subscribeToChat(studentId, currentUserId, (msgs) => {
                setMessages(msgs);
            });

            setTargetProfile(profile);
            setStatus(reqStatus);
            return () => unsubscribe();
        }
    }, [targetId, currentUserId, userRole]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (userRole === 'student') {
            // Student sending to Teacher (targetId)
            if (!status) {
                mockDB.createRequest(currentUserId, targetId, inputText);
                setStatus('pending');
            } else {
                mockDB.sendMessage(currentUserId, targetId, inputText, 'student');
            }
        } else {
            // Teacher sending to Student (targetId)
            mockDB.sendMessage(targetId, currentUserId, inputText, 'teacher');
        }

        setInputText("");
    };

    const handlePayment = () => {
        const month = new Date().toLocaleString('es-ES', { month: 'long' });
        const result = mockDB.processPayment(currentUserId, targetId, parseInt(payAmount), `Suscripción Mensual: ${month}`);
        if (result.success) {
            alert("Pago realizado con éxito!");
            setShowPayModal(false);
            // Send system message
            if (userRole === 'student') {
                mockDB.sendMessage(currentUserId, targetId, `💰 He pagado la mensualidad de ${month} (${payAmount}€)`, 'student');
            }
        } else {
            alert("Error: " + result.error);
        }
    };

    if (!targetProfile) return <div className="p-8 text-center text-white">Cargando perfil...</div>;

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-100px)] flex flex-col pt-4">
            {/* Header / Status Banner */}
            <div className="bg-[#262421] border border-[#302e2b] rounded-t-lg p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <img src={targetProfile.image} alt={targetProfile.name} className="w-12 h-12 rounded-full object-cover border border-[#403d39]" />
                    <div>
                        <h2 className="font-bold text-white text-lg">{targetProfile.name}</h2>
                        <p className="text-xs text-[#bababa]">{userRole === 'student' ? 'Profesor' : 'Estudiante'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {userRole === 'student' && status === 'approved' && (
                        <button
                            onClick={() => setShowPayModal(true)}
                            className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] border border-[#D4AF37]/50 px-3 py-2 rounded font-bold flex items-center gap-2 text-xs transition-colors mr-2"
                        >
                            <DollarSign size={14} /> Pagar Mensualidad
                        </button>
                    )}

                    {status === 'approved' && (
                        <button
                            onClick={() => navigate(userRole === 'student' ? `/classroom/${targetId}` : `/classroom/${currentUserId}`)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm transition-colors"
                        >
                            <CheckCircle size={16} /> Ir al Aula
                        </button>
                    )}
                    {status === 'pending' && (
                        <div className="bg-[#bf811d]/20 text-[#bf811d] border border-[#bf811d]/30 px-3 py-1 rounded text-xs flex items-center gap-2 font-bold">
                            <Clock size={14} /> Solicitud Pendiente
                        </div>
                    )}
                    {!status && userRole === 'student' && (
                        <div className="bg-gray-700/50 text-gray-400 px-3 py-1 rounded text-xs flex items-center gap-2">
                            <Lock size={14} /> Sin conexión
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow bg-[#161512] border-x border-[#302e2b] p-4 overflow-y-auto space-y-3 relative">
                {messages.length === 0 ? (
                    <div className="text-center text-[#666] mt-10">
                        <p className="mb-2">
                            {userRole === 'student'
                                ? `Envía un mensaje para solicitar clases con ${targetProfile.name}.`
                                : `Inicio del historial de chat con ${targetProfile.name}.`}
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender === userRole
                                ? 'bg-[#2b5f8f] text-white rounded-br-none' // Lichess-ish blue for self
                                : 'bg-[#262421] text-[#bababa] border border-[#302e2b] rounded-bl-none'
                                }`}>
                                <p>{msg.text}</p>
                                <span className="text-[10px] opacity-50 block text-right mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#262421] border border-[#302e2b] rounded-b-lg p-3 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={status === 'approved' ? "Escribe un mensaje..." : "Escribe para solicitar conexión..."}
                    className="flex-grow bg-[#161512] border border-[#302e2b] text-white text-sm rounded px-3 focus:outline-none focus:border-[#bf811d] transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="bg-[#bf811d] text-white p-2 rounded hover:bg-[#a66f19] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#262421] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">Pagar Mensualidad</h3>
                            <p className="text-xs text-[#8b8982]">Suscripción con {targetProfile.name}</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-bold text-[#8b8982] uppercase mb-2">Cantidad</label>
                            <input
                                type="number"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="w-full bg-[#1a1917] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37] font-bold text-lg mb-4"
                            />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-[#8b8982] hover:text-white font-bold text-sm">Cancelar</button>
                                <button onClick={handlePayment} className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-white transition-colors">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
