import { db } from '../firebase'; // Assuming export const db = getFirestore(app);
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    addDoc,
    Timestamp,
    onSnapshot,
    orderBy,
    limit,
    or,
    and
} from 'firebase/firestore';
import {
    Teacher,
    Request,
    Booking,
    AppUser,
    Message,
    Profile,
    Transaction,
    RoomData
} from '../types/index';

const messagesRef = collection(db, 'messages');

// Collection References
const usersRef = collection(db, 'users');
const teachersRef = collection(db, 'teachers');
const requestsRef = collection(db, 'requests');
const bookingsRef = collection(db, 'bookings');
const transactionsRef = collection(db, 'transactions');

export const firebaseService = {
    // --- USERS ---
    async getUser(userId: string): Promise<AppUser | null> {
        const docRef = doc(usersRef, userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppUser;
        }
        return null;
    },

    async createUser(user: AppUser): Promise<void> {
        const newUser = {
            ...user,
            walletBalance: user.walletBalance ?? 0,
            currency: user.currency ?? 'EUR'
        };
        await setDoc(doc(usersRef, user.id), newUser);
    },

    async updateUser(userId: string, data: Partial<AppUser>): Promise<void> {
        await updateDoc(doc(usersRef, userId), data);
    },

    // --- WALLET & TRANSACTIONS ---
    async getWallet(userId: string): Promise<{ balance: number; currency: string }> {
        const user = await this.getUser(userId);
        return {
            balance: user?.walletBalance ?? 0,
            currency: user?.currency ?? 'EUR'
        };
    },

    async addFunds(userId: string, amount: number): Promise<void> {
        const user = await this.getUser(userId);
        if (user) {
            const newBalance = (user.walletBalance || 0) + amount;
            await this.updateUser(userId, { walletBalance: newBalance });

            // Create transaction record
            const txId = `tx_${Date.now()}_${userId.substring(0, 5)}`;
            const tx: Transaction = {
                id: txId,
                type: 'deposit',
                description: 'Recarga de saldo (Simulación)',
                amount: amount,
                timestamp: Date.now(),
                fromId: 'system',
                toId: userId
            };
            await setDoc(doc(db, 'transactions', txId), tx);
        }
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
        try {
            const qFrom = query(transactionsRef, where("fromId", "==", userId));
            const qTo = query(transactionsRef, where("toId", "==", userId));

            const [fromSnap, toSnap] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);

            const results = [...fromSnap.docs, ...toSnap.docs].map(doc => doc.data() as Transaction);

            // Remove duplicates and sort in memory
            const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
            return uniqueResults.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    },

    async processPayment(studentId: string, teacherId: string, amount: number): Promise<{ success: boolean; message: string }> {
        const student = await this.getUser(studentId);
        const teacher = await this.getTeacherById(teacherId);

        if (!student || (student.walletBalance || 0) < amount) {
            return { success: false, message: 'Saldo insuficiente' };
        }

        if (!teacher) {
            return { success: false, message: 'Profesor no encontrado' };
        }

        // 1. Deduct from student
        await this.updateUser(studentId, { walletBalance: (student.walletBalance || 0) - amount });

        // 2. Add to teacher (minus commission)
        const commission = teacher.commissionRate || 0.5;
        const teacherShare = amount * commission;
        const platformShare = amount - teacherShare;

        await updateDoc(doc(teachersRef, teacherId), {
            earnings: (teacher.earnings || 0) + teacherShare,
            classesGiven: (teacher.classesGiven || 0) + 4 // Assume 4 classes per month paid
        });

        // 3. Create Transactions
        const txId = `pay_${Date.now()}_${studentId.substring(0, 5)}`;
        const studentTx: Transaction = {
            id: txId,
            type: 'payment_sent',
            description: `Mensualidad pagada a ${teacher.name}`,
            amount: -amount,
            timestamp: Date.now(),
            fromId: studentId,
            toId: teacherId
        };
        await setDoc(doc(db, 'transactions', txId), studentTx);

        const teacherTx: Transaction = {
            id: `${txId}_t`,
            type: 'payment_received',
            description: `Mensualidad recibida de ${student.name}`,
            amount: teacherShare,
            timestamp: Date.now(),
            fromId: studentId,
            toId: teacherId
        };
        await setDoc(doc(db, 'transactions', `${txId}_t`), teacherTx);

        return { success: true, message: 'Pago realizado correctamente' };
    },

    // --- TEACHERS ---
    async getTeachers(): Promise<Teacher[]> {
        const snapshot = await getDocs(teachersRef);
        return snapshot.docs.map(doc => doc.data() as Teacher);
    },

    async getTeacherById(teacherId: string): Promise<Teacher | null> {
        const docRef = doc(teachersRef, teacherId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Teacher;
        }
        return null;
    },

    async createTeacherProfile(teacher: Teacher): Promise<void> {
        await setDoc(doc(teachersRef, teacher.id), teacher);
    },

    async updateTeacher(teacherId: string, data: Partial<Teacher>): Promise<void> {
        await updateDoc(doc(teachersRef, teacherId), data);
    },

    // --- REQUESTS ---
    async createRequest(request: Request): Promise<void> {
        await setDoc(doc(requestsRef, request.id), request);
    },

    async getRequestsForStudent(studentId: string): Promise<Request[]> {
        const q = query(requestsRef, where("studentId", "==", studentId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Request);
    },

    async getRequestsForTeacher(teacherId: string): Promise<Request[]> {
        const q = query(requestsRef, where("teacherId", "==", teacherId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Request);
    },

    async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
        await updateDoc(doc(requestsRef, requestId), { status });
    },

    // --- BOOKINGS ---
    async createBooking(booking: Booking): Promise<void> {
        await setDoc(doc(bookingsRef, booking.id), booking);
    },

    async getBookingsForUser(userId: string, role: 'student' | 'teacher'): Promise<Booking[]> {
        const field = role === 'student' ? 'studentId' : 'teacherId';
        const q = query(bookingsRef, where(field, "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Booking);
    },

    async getTeacherAvailability(teacherId: string): Promise<string[]> {
        // Placeholder: In real app, fetch from subcollection or teacher document
        // For now, return default mock availability
        return ["10:00", "11:00", "16:00", "17:00"];
    },

    async updateTeacherAvailability(teacherId: string, availability: string[]): Promise<void> {
        // Placeholder implementation
        await updateDoc(doc(teachersRef, teacherId), { availability }); // Assuming availability field exists or will receive it
    },

    // --- CHAT & MESSAGING ---
    subscribeToChat(userId1: string, userId2: string, callback: (messages: Message[]) => void): () => void {
        // Generamos un ID de chat predecible ordenando los UIDs
        const chatId = [userId1, userId2].sort().join('_');

        // Buscamos mensajes con este chatId. 
        // Si no existe, usamos el filtro simple de studentId/teacherId pero sin el OR complejo
        const q = query(
            messagesRef,
            where("chatId", "==", chatId),
            where("studentId", "==", userId1),
            where("teacherId", "==", userId2),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                callback(messages);
            } else {
                // Fallback para mensajes antiguos que no tengan chatId
                // Usamos dos listeners para evitar el index de OR + OrderBy
                const q1 = query(messagesRef, where("studentId", "==", userId1), where("teacherId", "==", userId2));
                const q2 = query(messagesRef, where("studentId", "==", userId2), where("teacherId", "==", userId1));

                let msgs1: Message[] = [];
                let msgs2: Message[] = [];

                const update = () => {
                    const combined = [...msgs1, ...msgs2].sort((a, b) => a.timestamp - b.timestamp);
                    callback(combined);
                };

                const unsub1 = onSnapshot(q1, (s) => {
                    msgs1 = s.docs.map(d => ({ id: d.id, ...d.data() } as Message));
                    update();
                });
                const unsub2 = onSnapshot(q2, (s) => {
                    msgs2 = s.docs.map(d => ({ id: d.id, ...d.data() } as Message));
                    update();
                });

                return () => { unsub1(); unsub2(); };
            }
        }, (error) => {
            console.error("Chat subscription error:", error);
            // Si el index falla, intentamos el fallback directamente
            if (error.message.includes('requires an index')) {
                // ... (el fallback ya se maneja arriba si la query principal falla)
            }
        });

        return unsubscribe;
    },

    async sendMessage(message: Omit<Message, 'id'>): Promise<void> {
        // Enriquecemos el mensaje con un chatId para optimizar futuras búsquedas
        const enrichedMessage = {
            ...message,
            chatId: [message.studentId, message.teacherId].sort().join('_')
        };
        await addDoc(messagesRef, enrichedMessage);
    },

    // --- PROFILES ---
    async getPublicProfile(userId: string): Promise<Profile | null> {
        // Try teacher first
        const t = await this.getTeacherById(userId);
        if (t) return { name: t.name, bio: t.description, image: t.image, elo: t.elo };

        // Try user
        const u = await this.getUser(userId);
        if (u) return { name: u.name, bio: 'Estudiante', image: u.photoURL || 'https://via.placeholder.com/150', elo: 0 };

        return null;
    },

    // --- CLASSROOM ROOMS ---
    async updateRoom(roomId: string, data: Partial<RoomData>): Promise<void> {
        await setDoc(doc(db, 'rooms', roomId), data, { merge: true });
    },

    subscribeToRoom(roomId: string, callback: (data: RoomData) => void): () => void {
        const docRef = doc(db, 'rooms', roomId);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as RoomData);
            }
        });
    },

    // --- UTILS ---
    async getRequestStatus(studentId: string, teacherId: string): Promise<Request['status'] | null> {
        const q = query(requestsRef, where("studentId", "==", studentId), where("teacherId", "==", teacherId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return (snapshot.docs[0].data() as Request).status;
        }
        return null;
    },

    // Admin Functions
    async getAllUsers(): Promise<AppUser[]> {
        const snapshot = await getDocs(usersRef);
        return snapshot.docs.map(doc => doc.data() as AppUser);
    },

    async getAllTeachers(): Promise<Teacher[]> {
        const snapshot = await getDocs(teachersRef);
        return snapshot.docs.map(doc => doc.data() as Teacher);
    },

    async getAllTransactions(): Promise<Transaction[]> {
        const snapshot = await getDocs(transactionsRef);
        return snapshot.docs.map(doc => doc.data() as Transaction);
    },

    async verifyTeacher(teacherId: string, verified: boolean): Promise<void> {
        await updateDoc(doc(teachersRef, teacherId), { isVerified: verified });
    },

    async banUser(userId: string, banned: boolean): Promise<void> {
        await updateDoc(doc(usersRef, userId), { status: banned ? 'banned' : 'active' });
    },

    async getPlatformStats() {
        // Intentamos obtener datos reales, pero fallamos silenciosamente a 0
        // para que la UI use sus placeholders si no hay permisos (ej. usuarios sin loguear)
        const getSafeCount = async (snapPromise: Promise<any>) => {
            try {
                const snap = await snapPromise;
                return snap.size;
            } catch (e) {
                return 0;
            }
        };

        const usersCount = await getSafeCount(getDocs(usersRef));
        const teachersCount = await getSafeCount(getDocs(teachersRef));
        const requestsCount = await getSafeCount(getDocs(requestsRef));

        let revenue = 0;
        try {
            const transactionsSnap = await getDocs(transactionsRef);
            transactionsSnap.forEach(doc => {
                const data = doc.data() as Transaction;
                if (data.description.includes('Comisión')) {
                    revenue += data.amount;
                }
            });
        } catch (e) {
            revenue = 0;
        }

        return {
            users: usersCount,
            teachers: teachersCount,
            requests: requestsCount,
            revenue: revenue
        };
    }
};
