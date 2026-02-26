import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { Teacher } from '../types';
import { useAuth } from '../App';
import { RoomView } from '../components/RoomView';
import BookingModal from '../components/BookingModal';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';
import { FurnitureType } from '../components/Furniture';
import { getTeacherRoomLayout } from '../utils/roomLayouts';

const VisitorRoom: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const { currentUserId } = useAuth() || {};
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [furnitureModalAction, setFurnitureModalAction] = useState<FurnitureType | null>(null);

    useEffect(() => {
        if (!teacherId) return;
        const loadTeacher = async () => {
            const t = await firebaseService.getTeacherById(teacherId);
            setTeacher(t);
            setIsLoading(false);
        };
        loadTeacher();
    }, [teacherId]);

    const handleFurnitureClick = (type: FurnitureType) => {
        if (type === 'desk') {
            setIsBookingModalOpen(true);
        } else if (type === 'register') {
            setIsPaymentModalOpen(true);
        } else if (type === 'chess_table') {
            // Ir a la clase virtual en vivo
            navigate(`/classroom/${teacherId}`);
        } else if (type === 'door') {
            navigate('/mundo');
        } else {
            setFurnitureModalAction(type);
        }
    };

    const handlePaymentSuccess = async (method: 'stripe' | 'mercadopago') => {
        if (!currentUserId || !teacher) return;
        try {
            const res = await firebaseService.buySubscription(currentUserId, teacher, method);
            if (res.success) {
                toast.success(res.message);
                setIsPaymentModalOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error processing subscription:", error);
            toast.error("Error al procesar la suscripción");
        }
    };

    const handleBookingSuccess = () => {
        toast.success("¡Clase reservada con éxito!");
        setIsBookingModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-gold animate-bounce"></span>
                    <span className="w-4 h-4 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-4 h-4 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="text-white font-bold ml-2">Viajando al Aula...</span>
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="flex h-screen items-center justify-center bg-background p-4 text-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Oficina Cerrada</h1>
                    <p className="text-text-muted mb-6">El profesor que buscas no existe o su oficina no está disponible.</p>
                    <button onClick={() => navigate('/mundo')} className="btn-primary">
                        Volver al Mundo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] w-full bg-[#0d0d0c] relative overflow-hidden flex flex-col pt-12">

            {/* Header / Info overlay */}
            <div className="absolute top-24 left-8 z-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl liquid-glass pb-4 pointer-events-auto">
                    <h1 className="text-2xl font-black text-white">{teacher.name || 'Profesor'} <span className="text-gold">.</span></h1>
                    <p className="text-sm text-text-muted mt-1 max-w-[200px]">Sala virtual del profesor. ¡Haz clic en su avatar, o en los objetos!</p>
                    <button onClick={() => navigate('/mundo')} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors">
                        ← Ver Mapa
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full mx-auto relative rounded-3xl overflow-hidden shadow-2xl shadow-gold/10">
                <RoomView
                    roomId={`teacher_${teacherId}`}
                    width={getTeacherRoomLayout(teacher.earnings || 0).width}
                    height={getTeacherRoomLayout(teacher.earnings || 0).height}
                    furniturePlacements={getTeacherRoomLayout(teacher.earnings || 0).furniturePlacements}
                    obstacles={getTeacherRoomLayout(teacher.earnings || 0).obstacles}
                    onFurnitureClick={handleFurnitureClick}
                />
            </div>

            {/* Notification/Info Modals for basic furniture */}
            {furnitureModalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={() => setFurnitureModalAction(null)}>
                    <div className="liquid-glass-dark border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-4xl mb-4 text-center">📝</div>
                        <h2 className="text-xl font-black text-white text-center mb-2">Pizarra del Profesor</h2>
                        <p className="text-sm text-text-muted text-center mb-6">Esta es la pizarra privada del profesor. Sólo los estudiantes en clase pueden acceder a los recursos compartidos activamente.</p>
                        <button onClick={() => setFurnitureModalAction(null)} className="btn-secondary w-full">Cerrar</button>
                    </div>
                </div>
            )}

            {/* Actual Action Modals */}
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                teacher={teacher}
                studentId={currentUserId || ''}
                onSuccess={handleBookingSuccess}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                teacher={teacher}
            />
        </div>
    );
};

export default VisitorRoom;
