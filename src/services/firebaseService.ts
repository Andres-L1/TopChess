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
    onSnapshot,
    orderBy
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
        try {
            const docRef = doc(usersRef, userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as AppUser) : null;
        } catch (error) {
            console.error(`Error in getUser(${userId}):`, error);
            return null;
        }
    },

    async createUser(user: AppUser): Promise<void> {
        try {
            const newUser = {
                ...user,
                walletBalance: user.walletBalance ?? 0,
                currency: user.currency ?? 'EUR'
            };
            await setDoc(doc(usersRef, user.id), newUser);
        } catch (error) {
            console.error(`Error in createUser(${user.id}):`, error);
            throw error;
        }
    },

    async updateUser(userId: string, data: Partial<AppUser>): Promise<void> {
        try {
            await updateDoc(doc(usersRef, userId), data);
        } catch (error) {
            console.error(`Error in updateUser(${userId}):`, error);
            throw error;
        }
    },

    // --- WALLET & TRANSACTIONS ---
    async getWallet(userId: string): Promise<{ balance: number; currency: string }> {
        try {
            const user = await this.getUser(userId);
            return {
                balance: user?.walletBalance ?? 0,
                currency: user?.currency ?? 'EUR'
            };
        } catch (error) {
            console.error(`Error in getWallet(${userId}):`, error);
            return { balance: 0, currency: 'EUR' };
        }
    },

    async addFunds(userId: string, amount: number): Promise<void> {
        try {
            const user = await this.getUser(userId);
            if (user) {
                const newBalance = (user.walletBalance || 0) + amount;
                await this.updateUser(userId, { walletBalance: newBalance });

                const txId = `tx_${Date.now()}_${userId.substring(0, 5)}`;
                const tx: Transaction = {
                    id: txId,
                    type: 'deposit',
                    description: 'Recarga de saldo',
                    amount: amount,
                    timestamp: Date.now(),
                    fromId: 'system',
                    toId: userId
                };
                await setDoc(doc(db, 'transactions', txId), tx);
            }
        } catch (error) {
            console.error(`Error in addFunds(${userId}):`, error);
            throw error;
        }
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
        try {
            const qFrom = query(transactionsRef, where("fromId", "==", userId));
            const qTo = query(transactionsRef, where("toId", "==", userId));

            const [fromSnap, toSnap] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
            const results = [...fromSnap.docs, ...toSnap.docs].map(doc => doc.data() as Transaction);

            const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
            return uniqueResults.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error(`Error in getTransactions(${userId}):`, error);
            return [];
        }
    },

    async processPayment(studentId: string, teacherId: string, amount: number): Promise<{ success: boolean; message: string }> {
        try {
            const student = await this.getUser(studentId);
            const teacher = await this.getTeacherById(teacherId);

            if (!student || (student.walletBalance || 0) < amount) {
                return { success: false, message: 'Saldo insuficiente' };
            }

            if (!teacher) {
                return { success: false, message: 'Profesor no encontrado' };
            }

            await this.updateUser(studentId, { walletBalance: (student.walletBalance || 0) - amount });

            const commission = teacher.commissionRate || 0.5;
            const teacherShare = amount * commission;

            await updateDoc(doc(teachersRef, teacherId), {
                earnings: (teacher.earnings || 0) + teacherShare,
                classesGiven: (teacher.classesGiven || 0) + 4
            });

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
        } catch (error) {
            console.error('Error in processPayment:', error);
            return { success: false, message: 'Error interno al procesar el pago' };
        }
    },

    // --- TEACHERS ---
    async getTeachers(): Promise<Teacher[]> {
        try {
            const snapshot = await getDocs(teachersRef);
            return snapshot.docs.map(doc => doc.data() as Teacher);
        } catch (error) {
            console.error('Error in getTeachers:', error);
            return [];
        }
    },

    async getTeacherById(teacherId: string): Promise<Teacher | null> {
        try {
            const docRef = doc(teachersRef, teacherId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as Teacher) : null;
        } catch (error) {
            console.error(`Error in getTeacherById(${teacherId}):`, error);
            return null;
        }
    },

    async createTeacherProfile(teacher: Teacher): Promise<void> {
        try {
            await setDoc(doc(teachersRef, teacher.id), teacher);
        } catch (error) {
            console.error(`Error in createTeacherProfile(${teacher.id}):`, error);
            throw error;
        }
    },

    async updateTeacher(teacherId: string, data: Partial<Teacher>): Promise<void> {
        try {
            await updateDoc(doc(teachersRef, teacherId), data);
        } catch (error) {
            console.error(`Error in updateTeacher(${teacherId}):`, error);
            throw error;
        }
    },

    // --- REQUESTS ---
    async createRequest(request: Request): Promise<void> {
        try {
            await setDoc(doc(requestsRef, request.id), request);
        } catch (error) {
            console.error(`Error in createRequest(${request.id}):`, error);
            throw error;
        }
    },

    async getRequestsForStudent(studentId: string): Promise<Request[]> {
        try {
            const q = query(requestsRef, where("studentId", "==", studentId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Request);
        } catch (error) {
            console.error(`Error in getRequestsForStudent(${studentId}):`, error);
            return [];
        }
    },

    async getRequestsForTeacher(teacherId: string): Promise<Request[]> {
        try {
            const q = query(requestsRef, where("teacherId", "==", teacherId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Request);
        } catch (error) {
            console.error(`Error in getRequestsForTeacher(${teacherId}):`, error);
            return [];
        }
    },

    async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
        try {
            await updateDoc(doc(requestsRef, requestId), { status });
        } catch (error) {
            console.error(`Error in updateRequestStatus(${requestId}):`, error);
            throw error;
        }
    },

    // --- BOOKINGS ---
    async createBooking(booking: Booking): Promise<void> {
        try {
            await setDoc(doc(bookingsRef, booking.id), booking);
        } catch (error) {
            console.error(`Error in createBooking(${booking.id}):`, error);
            throw error;
        }
    },

    async getBookingsForUser(userId: string, role: 'student' | 'teacher'): Promise<Booking[]> {
        try {
            const field = role === 'student' ? 'studentId' : 'teacherId';
            const q = query(bookingsRef, where(field, "==", userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Booking);
        } catch (error) {
            console.error(`Error in getBookingsForUser(${userId}):`, error);
            return [];
        }
    },

    async getTeacherAvailability(teacherId: string): Promise<string[]> {
        try {
            // Placeholder: In real app, fetch from subcollection or teacher document
            return ["10:00", "11:00", "16:00", "17:00"];
        } catch (error) {
            console.error(`Error in getTeacherAvailability(${teacherId}):`, error);
            return [];
        }
    },

    async updateTeacherAvailability(teacherId: string, availability: string[]): Promise<void> {
        try {
            await updateDoc(doc(teachersRef, teacherId), { availability });
        } catch (error) {
            console.error(`Error in updateTeacherAvailability(${teacherId}):`, error);
            throw error;
        }
    },

    // --- CHAT & MESSAGING ---
    subscribeToChat(userId1: string, userId2: string, callback: (messages: Message[]) => void): () => void {
        const chatId = [userId1, userId2].sort().join('_');
        const q = query(
            messagesRef,
            where("chatId", "==", chatId),
            orderBy("timestamp", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            callback(messages);
        }, (error) => {
            console.error("Chat subscription error:", error);
        });
    },

    async sendMessage(message: Omit<Message, 'id'>): Promise<void> {
        try {
            const enrichedMessage = {
                ...message,
                chatId: [message.studentId, message.teacherId].sort().join('_')
            };
            await addDoc(messagesRef, enrichedMessage);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    },

    // --- PROFILES ---
    async getPublicProfile(userId: string): Promise<Profile | null> {
        try {
            const t = await this.getTeacherById(userId);
            if (t) return { name: t.name, bio: t.description, image: t.image, elo: t.elo };

            const u = await this.getUser(userId);
            if (u) return { name: u.name, bio: 'Estudiante', image: u.photoURL || 'https://via.placeholder.com/150', elo: 0 };

            return null;
        } catch (error) {
            console.error(`Error in getPublicProfile(${userId}):`, error);
            return null;
        }
    },

    // --- CLASSROOM ROOMS ---
    async updateRoom(roomId: string, data: Partial<RoomData>): Promise<void> {
        try {
            await setDoc(doc(db, 'rooms', roomId), data, { merge: true });
        } catch (error) {
            console.error(`Error in updateRoom(${roomId}):`, error);
            throw error;
        }
    },

    async updateChatMessages(chatId: string): Promise<void> {
        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, { updatedAt: Date.now() });
        } catch (error) {
            console.error(`Error in updateChatMessages(${chatId}):`, error);
            throw error;
        }
    },

    subscribeToRoom(roomId: string, callback: (data: RoomData) => void): () => void {
        const docRef = doc(db, 'rooms', roomId);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as RoomData);
            }
        }, (error) => {
            console.error(`Room subscription error (${roomId}):`, error);
        });
    },

    // --- UTILS ---
    async getRequestStatus(studentId: string, teacherId: string): Promise<Request['status'] | null> {
        try {
            const q = query(requestsRef, where("studentId", "==", studentId), where("teacherId", "==", teacherId));
            const snapshot = await getDocs(q);
            return !snapshot.empty ? (snapshot.docs[0].data() as Request).status : null;
        } catch (error) {
            console.error('Error in getRequestStatus:', error);
            return null;
        }
    },

    // Admin Functions
    async getAllUsers(): Promise<AppUser[]> {
        try {
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => doc.data() as AppUser);
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            return [];
        }
    },

    async getAllTeachers(): Promise<Teacher[]> {
        try {
            const snapshot = await getDocs(teachersRef);
            return snapshot.docs.map(doc => doc.data() as Teacher);
        } catch (error) {
            console.error('Error in getAllTeachers:', error);
            return [];
        }
    },

    async getAllTransactions(): Promise<Transaction[]> {
        try {
            const snapshot = await getDocs(transactionsRef);
            return snapshot.docs.map(doc => doc.data() as Transaction);
        } catch (error) {
            console.error('Error in getAllTransactions:', error);
            return [];
        }
    },

    async verifyTeacher(teacherId: string, verified: boolean): Promise<void> {
        try {
            await updateDoc(doc(teachersRef, teacherId), { isVerified: verified });
        } catch (error) {
            console.error(`Error in verifyTeacher(${teacherId}):`, error);
            throw error;
        }
    },

    async banUser(userId: string, banned: boolean): Promise<void> {
        try {
            await updateDoc(doc(usersRef, userId), { status: banned ? 'banned' : 'active' });
        } catch (error) {
            console.error(`Error in banUser(${userId}):`, error);
            throw error;
        }
    },

    async getPlatformStats() {
        try {
            const [usersSnap, teachersSnap, requestsSnap, txSnap] = await Promise.all([
                getDocs(usersRef),
                getDocs(teachersRef),
                getDocs(requestsRef),
                getDocs(transactionsRef)
            ]);

            const revenue = txSnap.docs
                .map(d => d.data() as Transaction)
                .filter(t => t.type === 'payment_received')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            return {
                users: usersSnap.size,
                teachers: teachersSnap.size,
                requests: requestsSnap.size,
                revenue
            };
        } catch (error) {
            console.error('Error in getPlatformStats:', error);
            return { users: 0, teachers: 0, requests: 0, revenue: 0 };
        }
    },

    subscribeToCollection(collectionName: string, callback: (data: any[]) => void): () => void {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(data);
        }, (error) => {
            console.error(`Collection subscription error (${collectionName}):`, error);
        });
    }
};
