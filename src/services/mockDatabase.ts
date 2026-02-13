import { Teacher, Request, Message, RoomData, WalletData, Transaction, Profile, Booking } from '../types/index';

// Seed Data
const INITIAL_TEACHERS: Teacher[] = [];

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
    getTeachers: (): Teacher[] => {
        const data = localStorage.getItem(DB_KEYS.TEACHERS);
        return data ? JSON.parse(data) : INITIAL_TEACHERS;
    },

    getTeacherById: (id: string): Teacher | null => {
        const teachers = mockDB.getTeachers();
        return teachers.find((t) => t.id === id) || null;
    },

    updateTeacher: (id: string, updates: Partial<Teacher>): Teacher | null => {
        const teachers = mockDB.getTeachers();
        const index = teachers.findIndex((t) => t.id === id);
        if (index !== -1) {
            teachers[index] = { ...teachers[index], ...updates };
            localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
            return teachers[index];
        }
        return null;
    },

    // Room Methods (Board State)
    getRoom: (teacherId: string): RoomData | null => {
        const rooms = JSON.parse(localStorage.getItem(DB_KEYS.ROOMS) || '{}');
        return rooms[teacherId] || null;
    },

    updateRoom: (teacherId: string, data: Partial<RoomData>) => {
        const rooms = JSON.parse(localStorage.getItem(DB_KEYS.ROOMS) || '{}');
        rooms[teacherId] = { ...rooms[teacherId], ...data };
        localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));

        // Dispatch explicit event for cross-component updates if needed
        window.dispatchEvent(new CustomEvent('room-update', {
            detail: { teacherId, data: rooms[teacherId] }
        }));
    },

    // Subscribe to room changes
    subscribeToRoom: (teacherId: string, callback: (data: RoomData) => void) => {
        const localHandler = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail.teacherId === teacherId) {
                callback(customEvent.detail.data);
            }
        };
        window.addEventListener('room-update', localHandler);

        const storageHandler = (e: StorageEvent) => {
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

        const currentData = mockDB.getRoom(teacherId);
        if (currentData) callback(currentData);

        return () => {
            window.removeEventListener('room-update', localHandler);
            window.removeEventListener('storage', storageHandler);
        };
    },

    // Requests & Chat Methods
    createRequest: (studentId: string, teacherId: string, initialMessage: string): Request => {
        const requests: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const existing = requests.find((r) => r.studentId === studentId && r.teacherId === teacherId);

        if (existing) {
            mockDB.sendMessage(studentId, teacherId, initialMessage, 'student');
            return existing;
        }

        const newRequest: Request = {
            id: Date.now().toString(),
            studentId,
            teacherId,
            status: 'pending',
            timestamp: Date.now()
        };

        requests.push(newRequest);
        localStorage.setItem('topchess_requests', JSON.stringify(requests));

        if (initialMessage) {
            mockDB.sendMessage(studentId, teacherId, initialMessage, 'student');
        }

        return newRequest;
    },

    getRequestStatus: (studentId: string, teacherId: string): Request['status'] | null => {
        const requests: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const req = requests.find((r) => r.studentId === studentId && r.teacherId === teacherId);
        return req ? req.status : null;
    },

    getRequestsForTeacher: (teacherId: string): Request[] => {
        const requests: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        return requests.filter((r) => r.teacherId === teacherId && r.status === 'pending');
    },

    getRequestsForStudent: (studentId: string): Request[] => {
        const requests: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        return requests.filter((r) => r.studentId === studentId);
    },

    updateRequestStatus: (studentId: string, teacherId: string, status: Request['status']): boolean => {
        const requests: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const index = requests.findIndex((r) => r.studentId === studentId && r.teacherId === teacherId);
        if (index !== -1) {
            requests[index].status = status;
            localStorage.setItem('topchess_requests', JSON.stringify(requests));
            return true;
        }
        return false;
    },

    // Messages
    sendMessage: (studentId: string, teacherId: string, text: string, senderRole: 'student' | 'teacher') => {
        const messages: Message[] = JSON.parse(localStorage.getItem('topchess_messages') || '[]');
        const newMessage: Message = {
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

    getMessages: (studentId: string, teacherId: string): Message[] => {
        const messages: Message[] = JSON.parse(localStorage.getItem('topchess_messages') || '[]');
        return messages.filter((m) => m.studentId === studentId && m.teacherId === teacherId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    subscribeToChat: (studentId: string, teacherId: string, callback: (msgs: Message[]) => void) => {
        const localHandler = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail.studentId === studentId && customEvent.detail.teacherId === teacherId) {
                callback(mockDB.getMessages(studentId, teacherId));
            }
        };
        window.addEventListener('chat-update', localHandler);

        const storageHandler = (e: StorageEvent) => {
            if (e.key === 'topchess_messages' && e.newValue) {
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
    getWallet: (userId: string): WalletData => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[userId]) {
            wallets[userId] = { balance: 0, currency: 'EUR' };
            localStorage.setItem('topchess_wallets', JSON.stringify(wallets));
        }
        return wallets[userId];
    },

    getTransactions: (userId: string): Transaction[] => {
        const txs: Transaction[] = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
        return txs.filter((tx) => tx.fromId === userId || tx.toId === userId).sort((a, b) => b.timestamp - a.timestamp);
    },

    addFunds: (userId: string, amount: number): WalletData => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[userId]) wallets[userId] = { balance: 0, currency: 'EUR' };

        wallets[userId].balance += amount;
        localStorage.setItem('topchess_wallets', JSON.stringify(wallets));

        // Log Transaction
        const txs: Transaction[] = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
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

    calculateCommission: (teacherId: string) => {
        const reqs: Request[] = JSON.parse(localStorage.getItem('topchess_requests') || '[]');
        const activeStudents = reqs.filter((r) => r.teacherId === teacherId && r.status === 'approved').length;

        let rate = 0.50;
        let levelName = 'Novato';
        let nextLevelStart: number | null = 3;

        if (activeStudents >= 20) {
            rate = 0.85;
            levelName = 'Gran Maestro';
            nextLevelStart = null;
        } else if (activeStudents >= 10) {
            rate = 0.75;
            levelName = 'Avanzado';
            nextLevelStart = 20;
        } else if (activeStudents >= 3) {
            rate = 0.65;
            levelName = 'Intermedio';
            nextLevelStart = 10;
        }

        return {
            rate,
            levelName,
            activeStudents,
            nextLevelStart,
            platformFee: (1 - rate)
        };
    },

    processPayment: (fromId: string, toId: string, amount: number, description: string): { success: boolean; error?: string } => {
        const wallets = JSON.parse(localStorage.getItem('topchess_wallets') || '{}');
        if (!wallets[fromId]) wallets[fromId] = { balance: 0, currency: 'EUR' };
        if (!wallets[toId]) wallets[toId] = { balance: 0, currency: 'EUR' };

        if (wallets[fromId].balance < amount) {
            return { success: false, error: 'Saldo insuficiente' };
        }

        const commInfo = mockDB.calculateCommission(toId);
        const studentCut = amount;
        const teacherNet = amount * commInfo.rate;

        wallets[fromId].balance -= studentCut;
        wallets[toId].balance += teacherNet;

        localStorage.setItem('topchess_wallets', JSON.stringify(wallets));

        const txs: Transaction[] = JSON.parse(localStorage.getItem('topchess_transactions') || '[]');
        const now = Date.now();

        txs.push({
            id: 'tx_out_' + now + '_' + fromId,
            type: 'payment_sent',
            fromId: fromId,
            toId: toId,
            amount: -studentCut,
            timestamp: now,
            description: description
        });

        txs.push({
            id: 'tx_in_' + now + '_' + toId,
            type: 'payment_received',
            fromId: fromId,
            toId: toId,
            amount: teacherNet,
            timestamp: now,
            description: `${description} (Comisión ${(commInfo.platformFee * 100).toFixed(0)}% aplicada)`
        });

        localStorage.setItem('topchess_transactions', JSON.stringify(txs));

        window.dispatchEvent(new Event('wallet-update'));
        return { success: true };
    },

    // Scheduling System
    getTeacherAvailability: (teacherId: string): string[] => {
        const avail = JSON.parse(localStorage.getItem('topchess_availability') || '{}');
        return avail[teacherId] || [];
    },

    updateTeacherAvailability: (teacherId: string, slots: string[]) => {
        const avail = JSON.parse(localStorage.getItem('topchess_availability') || '{}');
        avail[teacherId] = slots;
        localStorage.setItem('topchess_availability', JSON.stringify(avail));
    },

    getBookings: (): Booking[] => {
        return JSON.parse(localStorage.getItem('topchess_bookings') || '[]');
    },

    createBooking: (studentId: string, teacherId: string, slotId: string, dateIso: string) => {
        const bookings = mockDB.getBookings();
        if (bookings.find((b: any) => b.teacherId === teacherId && b.slotId === slotId && b.date === dateIso && b.status !== 'cancelled')) {
            return { success: false, error: 'Horario ya reservado' };
        }

        const newBooking: Booking = {
            id: 'bk_' + Date.now(),
            studentId,
            teacherId,
            slotId,
            date: dateIso,
            status: 'confirmed',
            timestamp: Date.now()
        };
        bookings.push(newBooking);
        localStorage.setItem('topchess_bookings', JSON.stringify(bookings));
        return { success: true, booking: newBooking };
    },

    // User Profile System
    getProfile: (userId: string): Profile => {
        const teachers = mockDB.getTeachers();
        const teacher = teachers.find((t) => t.id === userId);
        if (teacher) {
            return {
                name: teacher.name,
                bio: teacher.description,
                image: teacher.image,
                elo: teacher.elo
            };
        }

        const users = JSON.parse(localStorage.getItem('topchess_users') || '{}');
        if (users[userId]) return users[userId];

        return {
            name: userId === 'student1' ? 'Estudiante Demo' : `User ${userId}`,
            elo: 1200,
            image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            bio: "Estudiante de ajedrez apasionado."
        };
    },

    updateProfile: (userId: string, data: Partial<Profile>) => {
        const teachers = mockDB.getTeachers();
        const teacherIndex = teachers.findIndex((t) => t.id === userId);
        if (teacherIndex !== -1) {
            // Partial mapping back to Teacher (simple fields only)
            const updates: Partial<Teacher> = {};
            if (data.name) updates.name = data.name;
            if (data.bio) updates.description = data.bio;
            if (data.image) updates.image = data.image;
            if (data.elo) updates.elo = data.elo;

            teachers[teacherIndex] = { ...teachers[teacherIndex], ...updates };
            localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
            return teachers[teacherIndex];
        }

        const users = JSON.parse(localStorage.getItem('topchess_users') || '{}');
        users[userId] = { ...(users[userId] || mockDB.getProfile(userId)), ...data };
        localStorage.setItem('topchess_users', JSON.stringify(users));

        window.dispatchEvent(new CustomEvent('profile-update', { detail: { userId, profile: users[userId] } }));
        return users[userId];
    }
};
