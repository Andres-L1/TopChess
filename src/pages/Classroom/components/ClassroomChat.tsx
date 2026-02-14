import React, { useState } from 'react';
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

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText("");
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <div className="flex-grow p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#1b1a17]/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === userRole ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[85%] transition-all shadow-lg ${msg.sender === userRole
                            ? 'bg-gold/10 border border-gold/20 text-white'
                            : 'bg-white/5 border border-white/10 text-white/80'
                            }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2 block">
                                {msg.sender === 'teacher' ? 'Profesor' : 'Alumno'}
                            </span>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-[#1b1a17] flex gap-3 border-t border-white/5">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-white/20"
                />
                <button
                    onClick={handleSend}
                    className="p-3 bg-gold text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ClassroomChat;
