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
    limit,
    orderBy,
    getCountFromServer
} from 'firebase/firestore';
import {
    Teacher,
    Request,
    Booking,
    AppUser,
    Message,
    Profile,
    Transaction,
    RoomData,
    Homework,
    AppNotification,
    Club
} from '../types/index';

const messagesRef = collection(db, 'messages');

// Collection References
const usersRef = collection(db, 'users');
const teachersRef = collection(db, 'teachers');
const requestsRef = collection(db, 'requests');
const bookingsRef = collection(db, 'bookings');
const transactionsRef = collection(db, 'transactions');
const homeworksRef = collection(db, 'homeworks');
const notificationsRef = collection(db, 'notifications');
const clubsRef = collection(db, 'clubs');

// Helper to Replace undefined with null (Firestore doesn't support undefined)
const sanitizeFirestoreData = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(item => sanitizeFirestoreData(item));
    } else if (data !== null && typeof data === 'object') {
        return Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = value === undefined ? null : sanitizeFirestoreData(value);
            return acc;
        }, {} as any);
    }
    return data;
};

export const firebaseService = {
    // --- CLUBS ---
    async getClubByDirectorId(directorId: string): Promise<Club | null> {
        try {
            const q = query(clubsRef, where('directorId', '==', directorId), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as Club;
        } catch (error) {
            console.error(`Error in getClubByDirectorId(${directorId}):`, error);
            return null;
        }
    },

    observeClubTeachersPresence(teacherIds: string[], callback: (teachers: AppUser[]) => void) {
        if (!teacherIds || teacherIds.length === 0) {
            callback([]);
            return () => { };
        }

        // chunking in case teacherIds > 10 (firestore 'in' limit)
        // for simplicity, assume < 10 for MVP or we'll just query individual or full snapshot
        // If club has many teachers, standard technique is snapshotting the whole teachers org
        const q = query(usersRef, where('id', 'in', teacherIds));
        return onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as AppUser);
            callback(users);
        }, (error) => {
            console.error("Error observing club teachers presence:", error);
        });
    },

    async createClub(name: string, directorId: string): Promise<string> {
        try {
            const clubId = `club_${Date.now()}`;
            const newClub: Club = {
                id: clubId,
                name: name,
                directorId: directorId,
                teacherIds: [directorId], // Director is also a teacher in their club by default
                createdAt: Date.now()
            };
            await setDoc(doc(clubsRef, clubId), sanitizeFirestoreData(newClub));

            // Upgrade user role to club_director
            await this.updateUser(directorId, { role: 'club_director' });

            return clubId;
        } catch (error) {
            console.error("Error creating club:", error);
            throw error;
        }
    },

    async inviteTeacherToClub(clubId: string, teacherEmail: string): Promise<{ success: boolean; message: string }> {
        try {
            // 1. Find teacher by email
            const q = query(usersRef, where('email', '==', teacherEmail), where('role', '==', 'teacher'), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, message: 'No se encontró ningún profesor con ese correo electrónico' };
            }

            const teacherUser = snapshot.docs[0].data() as AppUser;
            const teacherId = teacherUser.id;

            // 2. Update Club
            const clubRef = doc(clubsRef, clubId);
            const clubSnap = await getDoc(clubRef);
            if (!clubSnap.exists()) return { success: false, message: 'Club no encontrado' };

            const clubData = clubSnap.data() as Club;
            if (clubData.teacherIds.includes(teacherId)) {
                return { success: false, message: 'El profesor ya es miembro de este club' };
            }

            const updatedTeacherIds = [...clubData.teacherIds, teacherId];
            await updateDoc(clubRef, { teacherIds: updatedTeacherIds });

            // 3. Update Teacher metadata
            await this.updateTeacher(teacherId, { clubId: clubId });

            return { success: true, message: `¡${teacherUser.name} ha sido añadido al club!` };
        } catch (error) {
            console.error("Error inviting teacher to club:", error);
            return { success: false, message: 'Error interno al invitar al profesor' };
        }
    },

    // --- USERS ---
    async getUser(userId: string): Promise<AppUser | null> {
        try {
            const docRef = doc(usersRef, userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as AppUser) : null;
        } catch (error) {
            console.error(`Error in getUser(${userId}):`, error);
            throw error; // Propagate error so App can handle retries/alerts instead of assuming new user
        }
    },

    async createUser(user: AppUser): Promise<void> {
        try {
            const newUser = {
                ...user,
                walletBalance: user.walletBalance ?? 0,
                currency: user.currency ?? 'EUR'
            };
            await setDoc(doc(usersRef, user.id), sanitizeFirestoreData(newUser));
        } catch (error) {
            console.error(`Error in createUser(${user.id}):`, error);
            throw error;
        }
    },

    async updateUser(userId: string, data: Partial<AppUser>): Promise<void> {
        try {
            await updateDoc(doc(usersRef, userId), sanitizeFirestoreData(data));
        } catch (error) {
            console.error(`Error in updateUser(${userId}):`, error);
            throw error;
        }
    },

    async updateUserPresence(userId: string, status: 'offline' | 'online' | 'in_class'): Promise<void> {
        try {
            await updateDoc(doc(usersRef, userId), {
                onlineStatus: status,
                lastActive: Date.now()
            });
        } catch (error) {
            console.error(`Error in updateUserPresence(${userId}):`, error);
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

    observeWallet(userId: string, callback: (wallet: { balance: number; currency: string }) => void) {
        if (!userId) {
            callback({ balance: 0, currency: 'EUR' });
            return () => { };
        }
        return onSnapshot(doc(usersRef, userId), (docSnap) => {
            if (docSnap.exists()) {
                const user = docSnap.data() as AppUser;
                callback({
                    balance: user.walletBalance ?? 0,
                    currency: user.currency ?? 'EUR'
                });
            } else {
                callback({ balance: 0, currency: 'EUR' });
            }
        }, (error) => {
            console.error("Error observing wallet:", error);
        });
    },

    async addFunds(userId: string, amount: number, method: 'stripe' | 'mercadopago' = 'stripe'): Promise<void> {
        try {
            const user = await this.getUser(userId);
            if (user) {
                const newBalance = (user.walletBalance || 0) + amount;
                await this.updateUser(userId, { walletBalance: newBalance });

                const txId = `tx_${Date.now()}_${userId.substring(0, 5)}`;
                const tx: Transaction = {
                    id: txId,
                    type: 'deposit',
                    description: `Recarga de saldo (${method === 'mercadopago' ? 'MercadoPago' : 'Stripe'})`,
                    amount: amount,
                    timestamp: Date.now(),
                    fromId: 'system',
                    toId: userId
                };
                await setDoc(doc(db, 'transactions', txId), sanitizeFirestoreData(tx));
            }
        } catch (error) {
            console.error(`Error in addFunds(${userId}):`, error);
            throw error;
        }
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
        try {
            const qFrom = query(transactionsRef, where("fromId", "==", userId), limit(100));
            const qTo = query(transactionsRef, where("toId", "==", userId), limit(100));

            const [fromSnap, toSnap] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
            const results = [...fromSnap.docs, ...toSnap.docs].map(doc => doc.data() as Transaction);

            const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
            return uniqueResults.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error(`Error in getTransactions(${userId}):`, error);
            return [];
        }
    },

    observeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
        if (!userId) {
            callback([]);
            return () => { };
        }
        const qFrom = query(transactionsRef, where("fromId", "==", userId), limit(100));
        const qTo = query(transactionsRef, where("toId", "==", userId), limit(100));
        let docsFrom: Transaction[] = [];
        let docsTo: Transaction[] = [];
        const emit = () => {
            const results = [...docsFrom, ...docsTo];
            const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
            callback(uniqueResults.sort((a, b) => b.timestamp - a.timestamp));
        };
        const unsubFrom = onSnapshot(qFrom, snapshot => {
            docsFrom = snapshot.docs.map(doc => doc.data() as Transaction);
            emit();
        }, error => console.error("Error observing tx from:", error));
        const unsubTo = onSnapshot(qTo, snapshot => {
            docsTo = snapshot.docs.map(doc => doc.data() as Transaction);
            emit();
        }, error => console.error("Error observing tx to:", error));
        return () => { unsubFrom(); unsubTo(); };
    },

    async processPayment(studentId: string, teacherId: string, amount: number): Promise<{ success: boolean; message: string }> {
        // ... obsolete method kept for backward compatibility if needed elsewhere
        return { success: false, message: 'Deprecated' };
    },

    async buySubscription(studentId: string, teacher: Teacher, method: string): Promise<{ success: boolean; message: string }> {
        try {
            const student = await this.getUser(studentId);
            if (!student) return { success: false, message: 'Usuario no encontrado' };

            // Find the approved request between this student and teacher
            const q = query(requestsRef, where("studentId", "==", studentId), where("teacherId", "==", teacher.id), where("status", "==", "approved"), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, message: 'No tienes una conexión activa con este profesor' };
            }

            const requestDoc = snapshot.docs[0];
            const requestData = requestDoc.data() as Request;
            const currentCredits = requestData.classCredits || 0;

            // Grant 4 classes
            await updateDoc(doc(requestsRef, requestDoc.id), {
                classCredits: currentCredits + 4
            });

            // Calculate earnings
            const commission = teacher.commissionRate || 0.5;
            const amount = teacher.region === 'EU' ? 59 : 39;
            const teacherShare = amount * commission;

            // Log Transaction
            const txId = `sub_${Date.now()}_${studentId.substring(0, 5)}`;
            const studentTx: Transaction = {
                id: txId,
                type: 'payment_sent',
                description: `Suscripción mensual: 4 clases con ${teacher.name}`,
                amount: -amount,
                timestamp: Date.now(),
                fromId: studentId,
                toId: teacher.id
            };
            await setDoc(doc(db, 'transactions', txId), sanitizeFirestoreData(studentTx));

            const teacherTx: Transaction = {
                id: `${txId}_t`,
                type: 'payment_received',
                description: `Suscripción de ${student.name}`,
                amount: teacherShare,
                timestamp: Date.now(),
                fromId: studentId,
                toId: teacher.id
            };
            await setDoc(doc(db, 'transactions', `${txId}_t`), sanitizeFirestoreData(teacherTx));

            return { success: true, message: '¡Suscripción exitosa! Tienes 4 nuevas clases disponibles.' };
        } catch (error) {
            console.error('Error in buySubscription:', error);
            return { success: false, message: 'Error interno al procesar el pago' };
        }
    },

    // --- TEACHERS ---
    async getTeachers(): Promise<Teacher[]> {
        try {
            // Limited to 200 to prevent crashing when the platform grows
            const q = query(teachersRef, limit(200));
            const snapshot = await getDocs(q);
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
            await setDoc(doc(teachersRef, teacher.id), sanitizeFirestoreData(teacher));
        } catch (error) {
            console.error(`Error in createTeacherProfile(${teacher.id}):`, error);
            throw error;
        }
    },

    async updateTeacher(teacherId: string, data: Partial<Teacher>): Promise<void> {
        try {
            await updateDoc(doc(teachersRef, teacherId), sanitizeFirestoreData(data));
        } catch (error) {
            console.error(`Error in updateTeacher(${teacherId}):`, error);
            throw error;
        }
    },

    // --- REQUESTS ---
    async createRequest(request: Request): Promise<void> {
        try {
            await setDoc(doc(requestsRef, request.id), sanitizeFirestoreData(request));
        } catch (error) {
            console.error(`Error in createRequest(${request.id}):`, error);
            throw error;
        }
    },

    async getRequestsForStudent(studentId: string): Promise<Request[]> {
        try {
            const q = query(requestsRef, where("studentId", "==", studentId), limit(100));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Request);
        } catch (error) {
            console.error(`Error in getRequestsForStudent(${studentId}):`, error);
            return [];
        }
    },

    async getRequestsForTeacher(teacherId: string): Promise<Request[]> {
        try {
            const q = query(requestsRef, where("teacherId", "==", teacherId), limit(100));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Request);
        } catch (error) {
            console.error(`Error in getRequestsForTeacher(${teacherId}):`, error);
            return [];
        }
    },

    observeRequestsForStudent(studentId: string, callback: (requests: Request[]) => void) {
        if (!studentId) {
            callback([]);
            return () => { };
        }
        const q = query(requestsRef, where("studentId", "==", studentId), limit(100));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data() as Request));
        }, (error) => {
            console.error("Error observing requests for student:", error);
        });
    },

    observeRequestsForTeacher(teacherId: string, callback: (requests: Request[]) => void) {
        if (!teacherId) {
            callback([]);
            return () => { };
        }
        const q = query(requestsRef, where("teacherId", "==", teacherId), limit(100));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data() as Request));
        }, (error) => {
            console.error("Error observing requests for teacher:", error);
        });
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
            await setDoc(doc(bookingsRef, booking.id), sanitizeFirestoreData(booking));
        } catch (error) {
            console.error(`Error in createBooking(${booking.id}):`, error);
            throw error;
        }
    },

    async bookClass(studentId: string, teacherId: string, booking: Booking): Promise<{ success: boolean; message: string }> {
        try {
            // Find the active request
            const q = query(requestsRef, where("studentId", "==", studentId), where("teacherId", "==", teacherId), where("status", "==", "approved"), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, message: 'No tienes una conexión activa con este profesor' };
            }

            const requestDoc = snapshot.docs[0];
            const requestData = requestDoc.data() as Request;
            const currentCredits = requestData.classCredits || 0;

            if (currentCredits <= 0) {
                return { success: false, message: 'No tienes clases disponibles. Adquiere una nueva suscripción.' };
            }

            // Create Booking
            await setDoc(doc(bookingsRef, booking.id), sanitizeFirestoreData(booking));

            // Decrement credits
            await updateDoc(doc(requestsRef, requestDoc.id), {
                classCredits: currentCredits - 1
            });

            // Notify Teacher
            this.createNotification({
                id: `notif_${Date.now()}_${teacherId.substring(0, 5)}`,
                userId: teacherId,
                title: '¡Nueva Clase Reservada!',
                message: `Te han reservado una clase el ${booking.date} a las ${booking.time}.`,
                type: 'booking',
                read: false,
                timestamp: Date.now(),
                link: '/dashboard'
            }).catch(console.error);

            return { success: true, message: 'Clase reservada exitosamente' };
        } catch (error) {
            console.error('Error in bookClass:', error);
            return { success: false, message: 'Error interno al reservar la clase' };
        }
    },

    async getBookingsForUser(userId: string, role: 'student' | 'teacher'): Promise<Booking[]> {
        try {
            const field = role === 'student' ? 'studentId' : 'teacherId';
            const q = query(bookingsRef, where(field, "==", userId), limit(100));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Booking);
        } catch (error) {
            console.error(`Error in getBookingsForUser(${userId}):`, error);
            return [];
        }
    },

    observeBookingsForUser(userId: string, role: 'student' | 'teacher', callback: (bookings: Booking[]) => void) {
        if (!userId) {
            callback([]);
            return () => { };
        }
        const field = role === 'student' ? 'studentId' : 'teacherId';
        const q = query(bookingsRef, where(field, "==", userId), limit(100));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data() as Booking));
        }, (error) => {
            console.error("Error observing bookings:", error);
        });
    },

    async getTeacherAvailability(teacherId: string): Promise<string[]> {
        try {
            const t = await this.getTeacherById(teacherId);
            return (t as any)?.availability || [];
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

    // --- HOMEWORK ---
    async createHomework(homework: Homework): Promise<void> {
        try {
            await setDoc(doc(homeworksRef, homework.id), sanitizeFirestoreData(homework));
        } catch (error) {
            console.error(`Error in createHomework(${homework.id}):`, error);
            throw error;
        }
    },

    async getHomeworksForStudent(studentId: string): Promise<Homework[]> {
        try {
            const q = query(homeworksRef, where("studentId", "==", studentId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Homework).sort((a, b) => b.assignedAt - a.assignedAt);
        } catch (error) {
            console.error(`Error in getHomeworksForStudent(${studentId}):`, error);
            return [];
        }
    },

    async getHomeworksForTeacher(teacherId: string): Promise<Homework[]> {
        try {
            const q = query(homeworksRef, where("teacherId", "==", teacherId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Homework).sort((a, b) => b.assignedAt - a.assignedAt);
        } catch (error) {
            console.error(`Error in getHomeworksForTeacher(${teacherId}):`, error);
            return [];
        }
    },

    async updateHomeworkStatus(homeworkId: string, status: 'pending' | 'completed'): Promise<void> {
        try {
            await updateDoc(doc(homeworksRef, homeworkId), {
                status,
                completedAt: status === 'completed' ? Date.now() : null
            });
        } catch (error) {
            console.error(`Error in updateHomeworkStatus(${homeworkId}):`, error);
            throw error;
        }
    },

    // --- CHAT & MESSAGING ---
    subscribeToChat(userId1: string, userId2: string, callback: (messages: Message[]) => void): () => void {
        const chatId = [userId1, userId2].sort().join('_');
        // Retrieve max 100 recent messages
        const q = query(
            messagesRef,
            where("chatId", "==", chatId),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Message))
                .sort((a, b) => a.timestamp - b.timestamp);
            callback(messages);
        }, (error) => {
            console.warn("Chat subscription error:", error);
        });
    },

    async sendMessage(message: Omit<Message, 'id'>): Promise<void> {
        try {
            const enrichedMessage = {
                ...message,
                chatId: [message.studentId, message.teacherId].sort().join('_')
            };
            await addDoc(messagesRef, sanitizeFirestoreData(enrichedMessage));

            // Notify the receiver
            const receiverId = message.sender === 'student' ? message.teacherId : message.studentId;
            const senderId = message.sender === 'student' ? message.studentId : message.teacherId;
            const senderLabel = message.sender === 'student' ? 'Tu alumno' : 'Tu maestro';

            this.createNotification({
                id: `notif_${Date.now()}_${receiverId.substring(0, 5)}`,
                userId: receiverId,
                title: 'Nuevo Mensaje',
                message: `${senderLabel} te ha enviado un mensaje.`,
                type: 'message',
                read: false,
                timestamp: Date.now(),
                link: `/chat/${senderId}`
            }).catch(console.error);
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
            await setDoc(doc(db, 'rooms', roomId), sanitizeFirestoreData(data), { merge: true });
        } catch (error) {
            console.error(`Error in updateRoom(${roomId}):`, error);
            throw error;
        }
    },

    async resetRoom(roomId: string): Promise<void> {
        try {
            await setDoc(doc(db, 'rooms', roomId), {
                fen: 'start',
                pgn: '',
                orientation: 'white',
                history: [],
                fenHistory: [],
                currentIndex: 0,
                shapes: [],
                chapters: [],
                activeChapterIndex: -1,
                activeStudyName: '',
                comment: '',
                comments: {}
            });
        } catch (error) {
            console.error(`Error in resetRoom(${roomId}):`, error);
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
        } catch {
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
    },

    async isAdmin(userId: string): Promise<boolean> {
        try {
            const user = await this.getUser(userId);
            const safeAdmins = ['andreslgumuzio@gmail.com'];
            return (user?.role === 'admin') || (user?.email ? safeAdmins.includes(user.email) : false);
        } catch (error) {
            console.error(`Error in isAdmin(${userId}):`, error);
            return false;
        }
    },

    async getLiveKitToken(roomId: string, participantName: string, role: 'student' | 'teacher' | 'admin'): Promise<string> {
        try {
            // Production: Fetch from your secure backend
            // const response = await fetch('/api/get-livekit-token', { method: 'POST', body: JSON.stringify({ roomId, participantName }) });
            // return (await response.json()).token;

            // Development/Demo Fallback: Return a placeholder that the frontend might accept for testing UI, 
            // but real connection requires a valid token signed with API Secret.
            // If you are getting "Mock" warnings, it is because we are in client-side only mode.
            return "DEV_TOKEN_PLACEHOLDER";
        } catch (error) {
            console.error("Error getting LiveKit token:", error);
            return "";
        }
    },

    // --- NOTIFICATIONS ---
    async createNotification(notification: AppNotification): Promise<void> {
        try {
            await setDoc(doc(notificationsRef, notification.id), sanitizeFirestoreData(notification));
        } catch (error) {
            console.error(`Error in createNotification(${notification.id}):`, error);
        }
    },

    subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => doc.data() as AppNotification);
            callback(notifs);
        });
    },

    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            await updateDoc(doc(notificationsRef, notificationId), { read: true });
        } catch (error) {
            console.error(`Error in markNotificationAsRead(${notificationId}):`, error);
        }
    },

    async getPlatformStats(): Promise<{ users: number, teachers: number, requests: number }> {
        try {
            const usersCount = await getCountFromServer(usersRef);
            const teachersCount = await getCountFromServer(teachersRef);
            const requestsCount = await getCountFromServer(requestsRef);

            return {
                users: usersCount.data().count,
                teachers: teachersCount.data().count,
                requests: requestsCount.data().count
            };
        } catch (error) {
            console.error("Error fetching platform stats:", error);
            return { users: 0, teachers: 0, requests: 0 };
        }
    }
};
