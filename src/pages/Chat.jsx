import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { Send, CheckCircle, Clock, Lock } from 'lucide-react';

const Chat = () => {
    const { teacherId } = useParams();
    const { userRole, currentUserId } = React.useContext(AuthContext);
    const navigate = useNavigate();

    // If user is teacher, they might be viewing a specific student chat? 
    // For MVP simplicy, this page is primarily for Student -> Teacher view.
    // Teachers will manage chats from Dashboard.

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState(null); // null, pending, approved
    const [teacher, setTeacher] = useState(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const tData = mockDB.getTeacherById(teacherId);
        if (tData) setTeacher(tData);

        // Load Status
        const currentStatus = mockDB.getRequestStatus(currentUserId, teacherId);
        setStatus(currentStatus);

        // Initial Messages
        setMessages(mockDB.getMessages(currentUserId, teacherId));

        // Subscribe to messages
        const unsubscribe = mockDB.subscribeToChat(currentUserId, teacherId, (msgs) => {
            setMessages(msgs);
            // Also re-check status in case it changed while chatting
            setStatus(mockDB.getRequestStatus(currentUserId, teacherId));
        });

        return () => unsubscribe();
    }, [teacherId, currentUserId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        // If no request exists, this message creates it
        if (!status) {
            mockDB.createRequest(currentUserId, teacherId, inputText);
            setStatus('pending');
        } else {
            mockDB.sendMessage(currentUserId, teacherId, inputText, 'student');
        }

        setInputText("");
    };

    if (!teacher) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-100px)] flex flex-col pt-4">
            {/* Header / Status Banner */}
            <div className="bg-[#262421] border border-[#302e2b] rounded-t-lg p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <img src={teacher.image} alt={teacher.name} className="w-12 h-12 rounded-full object-cover border border-[#403d39]" />
                    <div>
                        <h2 className="font-bold text-white text-lg">{teacher.name}</h2>
                        <p className="text-xs text-[#bababa]">Chat Directo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {status === 'approved' && (
                        <button
                            onClick={() => navigate(`/room/${teacherId}`)}
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
                    {!status && (
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
                        <p className="mb-2">Envía un mensaje para solicitar clases con <strong>{teacher.name}</strong>.</p>
                        <p className="text-sm">El profesor debe aprobar tu solicitud para acceder al aula.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender === 'student'
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
        </div>
    );
};

export default Chat;
