import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Message } from '../../../types/index';

interface ClassroomChatProps {
    messages: Message[];
    userRole: string | null;
    onSendMessage: (text: string) => void;
}

const ClassroomChat: React.FC<ClassroomChatProps> = ({
    messages,
    userRole,
    onSendMessage
}) => {
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the latest message whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText("");
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col animate-in fade-in duration-300">
            <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-black/20">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === userRole ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[85%] transition-all shadow-lg ${msg.sender === userRole
                            ? 'liquid-glass-subtle border-gold/20 text-white'
                            : 'liquid-glass border-white/5 text-white/80'
                            }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2 block">
                                {msg.sender === 'teacher' ? 'Profesor' : 'Alumno'}
                            </span>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 liquid-glass-dark flex gap-3 border-t-0">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="input-premium flex-grow"
                />
                <button
                    onClick={handleSend}
                    className="p-3 bg-gold text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20 liquid-shimmer"
                >
                    <span className="relative z-10"><Send size={18} /></span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(ClassroomChat);
