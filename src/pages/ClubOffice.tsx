import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Club, AppUser } from '../types/index';
import { motion } from 'framer-motion';
import { Users, MonitorPlay, Coffee, Map } from 'lucide-react';

const ClubOffice: React.FC = () => {
    const authContext = useContext(AuthContext);
    const [club, setClub] = useState<Club | null>(null);
    const [teachers, setTeachers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authContext?.currentUserId) return;

        const loadClub = async () => {
            const fetchedClub = await firebaseService.getClubByDirectorId(authContext.currentUserId);
            setClub(fetchedClub);
            setLoading(false);
        };
        loadClub();
    }, [authContext?.currentUserId]);

    useEffect(() => {
        if (!club || !club.teacherIds || club.teacherIds.length === 0) return;

        const unsubscribe = firebaseService.observeClubTeachersPresence(club.teacherIds, (updatedTeachers) => {
            setTeachers(updatedTeachers);
        });

        return () => unsubscribe();
    }, [club]);

    if (loading) {
        return <div className="min-h-screen bg-[#161512] flex items-center justify-center text-white">Cargando oficina...</div>;
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-[#161512] flex flex-col items-center justify-center text-white p-6 text-center">
                <Map size={48} className="text-gold mb-4" />
                <h1 className="text-2xl font-bold mb-2">Oficina Virtual no disponible</h1>
                <p className="text-white/60">No tienes ningún club asignado a tu cuenta de director actualmente.</p>
            </div>
        );
    }

    // Group teachers by status
    const inClassTeachers = teachers.filter(t => t.onlineStatus === 'in_class');
    const onlineTeachers = teachers.filter(t => t.onlineStatus === 'online');
    const offlineTeachers = teachers.filter(t => !t.onlineStatus || t.onlineStatus === 'offline');

    const renderAvatar = (teacher: AppUser) => (
        <motion.div
            key={teacher.id}
            layoutId={teacher.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 m-2"
        >
            <div className="relative">
                <img
                    src={teacher.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=333&color=fff`}
                    alt={teacher.name}
                    className="w-12 h-12 rounded-full border-2 border-[#1b1a17] shadow-lg object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1b1a17] ${teacher.onlineStatus === 'in_class' ? 'bg-red-500' :
                        teacher.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
            </div>
            <div className="text-xs text-white/80 font-medium bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
                {teacher.name.split(' ')[0]}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#161512] text-white pt-24 px-4 pb-12">
            <div className="max-w-6xl mx-auto">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Map className="text-gold" />
                            Oficina Virtual: {club.name}
                        </h1>
                        <p className="text-white/60 mt-2">Monitorea la actividad de tus profesores en tiempo real.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[#1b1a17] px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Clases
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Online
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div> Offline
                        </div>
                    </div>
                </div>

                {/* 2D Map Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Aulas (In Class) */}
                    <div className="col-span-1 lg:col-span-2 bg-[#1b1a17] border border-white/5 rounded-2xl p-6 min-h-[400px] relative overflow-hidden group">
                        {/* Decorative Grid Background */}
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                        <div className="relative z-10 flex items-center gap-2 mb-6">
                            <MonitorPlay className="text-red-500" />
                            <h2 className="text-xl font-bold">Aulas y Despachos</h2>
                            <span className="ml-2 bg-white/5 px-2 py-0.5 rounded-full text-xs text-white/40">{inClassTeachers.length}</span>
                        </div>

                        <div className="relative z-10 flex flex-wrap gap-4">
                            {inClassTeachers.length > 0 ? (
                                inClassTeachers.map(renderAvatar)
                            ) : (
                                <p className="text-white/30 text-sm italic w-full text-center py-12">Ningún profesor en clase actualmente.</p>
                            )}
                        </div>
                    </div>

                    {/* Right column: Lounge & Offline */}
                    <div className="col-span-1 flex flex-col gap-6">

                        {/* Lounge (Online) */}
                        <div className="bg-[#1b1a17] border border-white/5 rounded-2xl p-6 flex-1 min-h-[250px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full"></div>
                            <div className="relative z-10 flex items-center gap-2 mb-6">
                                <Users className="text-green-500" />
                                <h2 className="text-xl font-bold">Lounge</h2>
                                <span className="ml-2 bg-white/5 px-2 py-0.5 rounded-full text-xs text-white/40">{onlineTeachers.length}</span>
                            </div>
                            <div className="relative z-10 flex flex-wrap gap-4">
                                {onlineTeachers.length > 0 ? (
                                    onlineTeachers.map(renderAvatar)
                                ) : (
                                    <p className="text-white/30 text-sm italic w-full text-center py-8">Lounge vacío.</p>
                                )}
                            </div>
                        </div>

                        {/* Offline */}
                        <div className="bg-[#1b1a17]/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                            <div className="relative z-10 flex items-center gap-2 mb-6">
                                <Coffee className="text-gray-500" />
                                <h2 className="text-xl font-bold">Descansando</h2>
                                <span className="ml-2 bg-white/5 px-2 py-0.5 rounded-full text-xs text-white/40">{offlineTeachers.length}</span>
                            </div>
                            <div className="relative z-10 flex flex-wrap gap-4">
                                {offlineTeachers.length > 0 ? (
                                    offlineTeachers.map(renderAvatar)
                                ) : (
                                    <p className="text-white/30 text-sm italic w-full text-center py-4">Todos están trabajando.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClubOffice;
