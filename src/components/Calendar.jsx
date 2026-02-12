import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = [
    "09:00", "10:00", "11:00", "12:00",
    "16:00", "17:00", "18:00", "19:00", "20:00"
];

const Calendar = ({ mode = 'view', availability = [], bookings = [], onSlotClick, onSaveAvailability }) => {
    // Mode: 'edit' (Teacher sets slots) | 'view' (Student books slots) | 'read-only'

    // For MVP we just show a generic "Weekly Template" for availability editing,
    // and a specific date picker for booking. 
    // To keep it simple: Teacher sets "Weekly Recursive Availability".
    // Student sees next 7 days based on that template.

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [localAvailability, setLocalAvailability] = useState(availability);

    useEffect(() => {
        setLocalAvailability(availability);
    }, [availability]);

    const handleSlotClick = (dayIndex, hour) => {
        if (mode === 'edit') {
            // Toggle slot in recursive weekly template
            const slotId = `${dayIndex}-${hour}`;
            const newAvail = localAvailability.includes(slotId)
                ? localAvailability.filter(s => s !== slotId)
                : [...localAvailability, slotId];

            setLocalAvailability(newAvail);
            if (onSaveAvailability) onSaveAvailability(newAvail); // Auto-save or wait for button? let's auto-save parent
        } else if (mode === 'view') {
            // Initiate Booking
            // In view mode, we need real dates. 
            // Let's assume the grid shows "Upcoming Week".
            // Implementation detail: User selects a slot to book.
            if (onSlotClick) onSlotClick({ dayIndex, hour });
        }
    };

    const isSlotAvailable = (dayIndex, hour) => {
        const slotId = `${dayIndex}-${hour}`;
        return localAvailability.includes(slotId);
    };

    const isSlotBooked = (dayIndex, hour) => {
        // Check against real bookings if necessary
        // For MVP, if teacher is blocked, we just show it.
        return false;
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gold">
                    <CalendarIcon size={20} />
                    <h3 className="font-bold text-lg">
                        {mode === 'edit' ? 'Configurar Disponibilidad Semanal' : 'Próxima Semana'}
                    </h3>
                </div>
                {mode === 'edit' && (
                    <span className="text-xs text-text-muted">Haz clic en las horas para activar/desactivar.</span>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-8 gap-1 md:gap-2">
                {/* Time Column Header */}
                <div className="text-center font-bold text-text-muted text-xs py-2">H</div>

                {/* Day Headers */}
                {DAYS.map((d, i) => (
                    <div key={i} className="text-center font-bold text-white text-xs py-2 bg-white/5 rounded-t-lg">
                        {d}
                    </div>
                ))}

                {/* Rows */}
                {HOURS.map((hour) => (
                    <React.Fragment key={hour}>
                        {/* Time Label */}
                        <div className="flex items-center justify-center text-[10px] text-text-muted font-mono">
                            {hour}
                        </div>

                        {/* Slots */}
                        {DAYS.map((_, dayIndex) => {
                            const active = isSlotAvailable(dayIndex, hour);
                            const booked = isSlotBooked(dayIndex, hour);

                            let cellClass = "aspect-square rounded-lg border border-white/5 transition-all duration-200 flex items-center justify-center cursor-pointer ";

                            if (mode === 'edit') {
                                if (active) cellClass += "bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-500";
                                else cellClass += "bg-black/20 hover:bg-white/5 text-transparent";
                            } else {
                                // View/Book Mode
                                if (active && !booked) cellClass += "bg-white/5 hover:bg-gold/20 hover:border-gold/50 text-gold/0 hover:text-gold cursor-pointer";
                                else if (booked) cellClass += "bg-red-500/10 border-red-500/20 cursor-not-allowed";
                                else cellClass += "bg-black/40 opacity-50 cursor-not-allowed";
                            }

                            return (
                                <div
                                    key={`${dayIndex}-${hour}`}
                                    onClick={() => handleSlotClick(dayIndex, hour)}
                                    className={cellClass}
                                >
                                    {mode === 'edit' && active && <Check size={14} strokeWidth={3} />}
                                    {mode === 'view' && active && !booked && <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {mode === 'edit' && (
                <div className="flex justify-end">
                    <button
                        onClick={() => onSaveAvailability && onSaveAvailability(localAvailability)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Check size={16} /> Guardar Horario
                    </button>
                </div>
            )}
        </div>
    );
};

export default Calendar;
