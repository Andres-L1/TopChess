import React from 'react';
import Calendar from '../../../components/Calendar';

interface TeacherScheduleTabProps {
    availability: string[];
    handleSaveAvailability: (av: string[]) => Promise<void>;
}

const TeacherScheduleTab: React.FC<TeacherScheduleTabProps> = ({
    availability,
    handleSaveAvailability
}) => {
    return (
        <div className="glass-panel p-4 md:p-6 rounded-2xl animate-enter overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
                <Calendar
                    mode="edit"
                    availability={availability}
                    onSaveAvailability={handleSaveAvailability}
                />
            </div>
        </div>
    );
};

export default React.memo(TeacherScheduleTab);
