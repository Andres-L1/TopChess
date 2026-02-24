import React, { useState } from 'react';
import { X } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Teacher, Booking } from '../types';
import Calendar from './Calendar';
import toast from 'react-hot-toast';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher;
    studentId: string;
    onSuccess?: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    teacher,
    studentId,
    onSuccess
}) => {
    if (!isOpen || !teacher) return null;

    const handleSlotBook = async (slot: { dayIndex: number; hour: string }) => {
        const slotId = `${slot.dayIndex}-${slot.hour}`;
        const bookingId = `booking_${Date.now()}`;

        const newBooking: Booking = {
            id: bookingId,
            studentId: studentId,
            teacherId: teacher.id,
            slotId: slotId,
            date: new Date().toISOString().split('T')[0], // For MVP we use today's date as base, in reality we'd pick a day
            time: slot.hour,
            status: 'pending', // Always pending for manual approval
            timestamp: Date.now(),
            meetingLink: `/classroom/${teacher.id}`
        };

        try {
            const res = await firebaseService.bookClass(studentId, teacher.id, newBooking);
            if (res.success) {
                toast.success("Solicitud de clase enviada. Espera la aprobación del profesor.");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            toast.error("Error al reservar la clase");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                    aria-label="Cerrar Modal"
                >
                    <X size={24} />
                </button>

                <div className="p-8 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white mb-1">Reservar Clase</h2>
                    <p className="text-[#8b8982]">Selecciona un horario con <span className="text-gold font-bold">{teacher.name}</span></p>
                </div>

                <div className="p-8">
                    <Calendar
                        mode="view"
                        availability={teacher.availability || []}
                        onSlotClick={handleSlotBook}
                    />

                    <div className="mt-8 p-4 rounded-xl bg-gold/5 border border-gold/10">
                        <p className="text-[10px] text-gold uppercase font-black tracking-widest mb-1">Nota importante</p>
                        <p className="text-xs text-gold/70 leading-relaxed">
                            Tu solicitud quedará en estado <span className="font-bold">pendiente</span> hasta que el profesor la apruebe. Una vez aprobada, recibirás una notificación y podrás acceder al aula.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
