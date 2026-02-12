
// Seed Data
const INITIAL_TEACHERS = [
    {
        id: "teacher1",
        name: "GM Ana Smith",
        elo: 2450,
        price: 35,
        classesGiven: 42,
        earnings: 1250.50,
        description: "Especialista en defensa siciliana y finales.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tags: ['Strategy', 'Endgame', 'Advanced'],
        teachingStyle: 'Analítica y paciente. Me enfoco en la comprensión profunda de los finales y estructuras de peones.',
        curriculum: '1. Dominio de la Defensa Siciliana. 2. Finales de Torres teóricos. 3. Planificación estratégica en medio juego.'
    },
    {
        id: "teacher2",
        name: "IM Carlos Ruiz",
        elo: 2310,
        price: 25,
        classesGiven: 18,
        earnings: 450.00,
        description: "Entrenador táctico para jugadores de club.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tags: ['Tactics', 'Beginner', 'Kids'],
        teachingStyle: 'Dinámico y divertido. Ideal para niños y principiantes que quieren mejorar su visión táctica rápidamente.',
        curriculum: '1. Patrones tácticos básicos. 2. Aperturas agresivas para blancas. 3. Cómo evitar errores graves.'
    },
    {
        id: "teacher3",
        name: "WGM Sarah Polgar",
        elo: 2505,
        price: 50,
        classesGiven: 156,
        earnings: 7800.00,
        description: "Ex-campeona mundial juvenil. Clases avanzadas.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        tags: ['Opening Prep', 'Psychology', 'Master'],
        teachingStyle: 'Rigurosa y competitiva. Preparación profesional para torneos y psicología deportiva.',
        curriculum: '1. Repertorio de Gran Maestro. 2. Psicología en la competición. 3. Cálculo complejo.'
    }
];

const DB_KEYS = {
    TEACHERS: 'topchess_teachers',
    ROOMS: 'topchess_rooms'
};

export const mockDB = {
    // Initialize DB if empty
    initialize: () => {
        if (!localStorage.getItem(DB_KEYS.TEACHERS)) {
            localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
        }
        if (!localStorage.getItem(DB_KEYS.ROOMS)) {
            localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify({}));
        }
    },

    // Teacher Methods
    getTeachers: () => {
        const data = localStorage.getItem(DB_KEYS.TEACHERS);
        return data ? JSON.parse(data) : INITIAL_TEACHERS;
    },

    getTeacherById: (id) => {
        const teachers = mockDB.getTeachers();
        return teachers.find(t => t.id === id) || null;
    },

    updateTeacher: (id, updates) => {
        const teachers = mockDB.getTeachers();
        const index = teachers.findIndex(t => t.id === id);
        if (index !== -1) {
            teachers[index] = { ...teachers[index], ...updates };
            localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
            return teachers[index];
        }
        return null;
    },

    // Room Methods (Board State)
    getRoom: (teacherId) => {
        const rooms = JSON.parse(localStorage.getItem(DB_KEYS.ROOMS) || '{}');
        return rooms[teacherId] || null;
    },

    updateRoom: (teacherId, data) => {
        const rooms = JSON.parse(localStorage.getItem(DB_KEYS.ROOMS) || '{}');
        rooms[teacherId] = { ...rooms[teacherId], ...data };
        localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));

        // Dispatch explicit event for cross-component updates if needed, 
        // essentially mocking realtime subscription updates (within same tab)
        window.dispatchEvent(new CustomEvent('room-update', {
            detail: { teacherId, data: rooms[teacherId] }
        }));
    },

    // Subscribe to room changes (Mocking onValue with CROSS-TAB support)
    subscribeToRoom: (teacherId, callback) => {
        // 1. Same-tab updates (via CustomEvent)
        const localHandler = (e) => {
            if (e.detail.teacherId === teacherId) {
                callback(e.detail.data);
            }
        };
        window.addEventListener('room-update', localHandler);

        // 2. Cross-tab updates (via storage event)
        const storageHandler = (e) => {
            if (e.key === DB_KEYS.ROOMS && e.newValue) {
                try {
                    const rooms = JSON.parse(e.newValue);
                    const roomData = rooms[teacherId];
                    if (roomData) {
                        callback(roomData);
                    }
                } catch (err) {
                    console.error("Error parsing storage update", err);
                }
            }
        };
        window.addEventListener('storage', storageHandler);

        // Initial call
        const currentData = mockDB.getRoom(teacherId);
        if (currentData) callback(currentData);

        return () => {
            window.removeEventListener('room-update', localHandler);
            window.removeEventListener('storage', storageHandler);
        };
    },

    // Requests & Chat Methods
    createRequest: (studentId, teacherId, initialMessage) => {
        const requests = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const existing = requests.find(r => r.studentId === studentId && r.teacherId === teacherId);

        if (existing) {
            mockDB.sendMessage(studentId, teacherId, initialMessage, 'student');
            return existing;
        }

        const newRequest = {
            id: Date.now().toString(),
            studentId,
            teacherId,
            status: 'pending', // 'approved', 'rejected'
            timestamp: Date.now()
        };

        requests.push(newRequest);
        localStorage.setItem('topchess_requests', JSON.stringify(requests));

        if (initialMessage) {
            mockDB.sendMessage(studentId, teacherId, initialMessage, 'student');
        }

        return newRequest;
    },

    getRequestStatus: (studentId, teacherId) => {
        const requests = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const req = requests.find(r => r.studentId === studentId && r.teacherId === teacherId);
        return req ? req.status : null;
    },

    getRequestsForTeacher: (teacherId) => {
        const requests = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        return requests.filter(r => r.teacherId === teacherId && r.status === 'pending');
    },

    updateRequestStatus: (studentId, teacherId, status) => {
        const requests = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const index = requests.findIndex(r => r.studentId === studentId && r.teacherId === teacherId);
        if (index !== -1) {
            requests[index].status = status;
            localStorage.setItem('topchess_requests', JSON.stringify(requests));
            return true;
        }
        return false;
    },

    // Messages
    sendMessage: (studentId, teacherId, text, senderRole) => {
        const messages = JSON.parse(localStorage.getItem('topchess_messages') || '[]');
        const newMessage = {
            id: Date.now().toString() + Math.random(),
            studentId,
            teacherId,
            text,
            sender: senderRole,
            timestamp: Date.now()
        };
        messages.push(newMessage);
        localStorage.setItem('topchess_messages', JSON.stringify(messages));

        window.dispatchEvent(new CustomEvent('chat-update', {
            detail: { studentId, teacherId }
        }));
    },

    getMessages: (studentId, teacherId) => {
        const messages = JSON.parse(localStorage.getItem('topchess_messages') || '[]');
        return messages.filter(m => m.studentId === studentId && m.teacherId === teacherId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    subscribeToChat: (studentId, teacherId, callback) => {
        const localHandler = (e) => {
            if (e.detail.studentId === studentId && e.detail.teacherId === teacherId) {
                callback(mockDB.getMessages(studentId, teacherId));
            }
        };
        window.addEventListener('chat-update', localHandler);

        const storageHandler = (e) => {
            if (e.key === 'topchess_messages' && e.newValue) {
                // When messages change effectively, re-fetch specifically for this chat
                callback(mockDB.getMessages(studentId, teacherId));
            }
        };
        window.addEventListener('storage', storageHandler);

        return () => {
            window.removeEventListener('chat-update', localHandler);
            window.removeEventListener('storage', storageHandler);
        };
    },

    // Wallet & Payments System
    getWallet: (userId) => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[userId]) {
            wallets[userId] = { balance: 0, currency: 'EUR' };
            localStorage.setItem('topchess_wallets', JSON.stringify(wallets));
        }
        return wallets[userId];
    },

    getTransactions: (userId) => {
        const txs = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
        return txs.filter(tx => tx.fromId === userId || tx.toId === userId).sort((a, b) => b.timestamp - a.timestamp);
    },

    addFunds: (userId, amount) => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[userId]) wallets[userId] = { balance: 0, currency: 'EUR' };

        wallets[userId].balance += amount;
        localStorage.setItem('topchess_wallets', JSON.stringify(wallets));

        // Log Transaction
        const txs = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
        txs.push({
            id: 'tx_' + Date.now(),
            type: 'deposit',
            fromId: 'system',
            toId: userId,
            amount: amount,
            timestamp: Date.now(),
            description: 'Recarga de Saldo'
        });
        localStorage.setItem('topchess_transactions', JSON.stringify(txs));

        window.dispatchEvent(new Event('wallet-update'));
        return wallets[userId];
    },

    processPayment: (fromId, toId, amount, description) => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[fromId]) wallets[fromId] = { balance: 0, currency: 'EUR' };
        if (!wallets[toId]) wallets[toId] = { balance: 0, currency: 'EUR' };

        if (wallets[fromId].balance < amount) {
            return { success: false, error: 'Saldo insuficiente' };
        }

        // Deduct
        wallets[fromId].balance -= amount;
        // Add
        wallets[toId].balance += amount;

        localStorage.setItem('topchess_wallets', JSON.stringify(wallets));

        // Log Transaction
        const txs = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
        txs.push({
            id: 'tx_' + Date.now(),
            type: 'payment',
            fromId: fromId,
            toId: toId,
            amount: amount,
            timestamp: Date.now(),
            description: description || 'Pago de servicio'
        });
        localStorage.setItem('topchess_transactions', JSON.stringify(txs));

        window.dispatchEvent(new Event('wallet-update'));
        return { success: true };
    }
};
