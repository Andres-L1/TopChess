import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { mockDB } from '../services/mockDatabase';
import { User, Save, Camera, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile = () => {
    const { currentUserId } = useAuth();
    const [profile, setProfile] = useState({ name: '', bio: '', image: '', elo: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = mockDB.getProfile(currentUserId);
        if (data) {
            setProfile(data);
        }
        setLoading(false);
    }, [currentUserId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        mockDB.updateProfile(currentUserId, profile);
        toast.success("Perfil actualizado correctamente");
    };

    if (loading) return <div className="text-white p-8">Cargando perfil...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in pb-24">
            <h1 className="text-3xl font-bold font-display text-white mb-2">Mi Perfil</h1>
            <p className="text-text-muted mb-8">Personaliza tu identidad en la plataforma.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Stats */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center h-fit">
                    <div className="relative group mb-4">
                        <div
                            className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-white/5 shadow-2xl"
                            style={{ backgroundImage: `url(${profile.image})` }}
                        ></div>
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                    <p className="text-gold font-mono text-sm mb-4">ELO {profile.elo}</p>

                    <div className="w-full pt-4 border-t border-white/5 space-y-2">
                        <div className="flex justify-between text-xs text-text-muted">
                            <span>ID Usuario</span>
                            <span className="font-mono text-white opacity-50">{currentUserId}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-muted">
                            <span>Miembro desde</span>
                            <span className="text-white">Nov 2023</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2 glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <User size={18} className="text-gold" /> Información Personal
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Nombre Visible</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Biografía</label>
                            <textarea
                                name="bio"
                                value={profile.bio || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors"
                                placeholder="Cuéntanos sobre tu experiencia en ajedrez..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">URL de Avatar</label>
                            <input
                                type="text"
                                name="image"
                                value={profile.image}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-xs font-mono focus:border-gold/50 focus:outline-none transition-colors"
                            />
                            <p className="text-[10px] text-text-muted mt-1">Usa una URL de imagen válida (ej. Unsplash).</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="btn-primary flex items-center gap-2 px-6"
                            >
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
