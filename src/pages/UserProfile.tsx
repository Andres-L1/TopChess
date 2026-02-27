import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { User, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Wallet from './Wallet';

const UserProfile = () => {
    const { currentUserId } = useAuth()!;
    const { t } = useTranslation();
    const [profile, setProfile] = useState({ name: '', bio: '', image: '', elo: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'wallet'>('info');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await firebaseService.getUser(currentUserId);
                if (data) {
                    setProfile({
                        name: data.name || '',
                        bio: data.bio || '',
                        image: data.photoURL || '',
                        elo: data.elo || 0
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                toast.error('Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        };
        if (currentUserId) loadProfile();
    }, [currentUserId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            await firebaseService.updateUser(currentUserId, {
                name: profile.name,
                photoURL: profile.image,
                ...(profile.bio ? { bio: profile.bio } : {}),
            });
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Error al guardar los cambios');
        }
    };

    if (loading) return <div className="text-white p-8">Cargando perfil...</div>;

    return (
        <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in flex flex-col items-center h-full overflow-y-auto min-h-full">
            <h1 className="text-3xl font-bold font-display text-white mb-2">{t('profile.title')}</h1>

            {/* Tabs */}
            <div className="flex bg-white/5 rounded-full p-1 mb-8 w-fit backdrop-blur-md border border-white/10">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                    Info Perfil
                </button>
                <button
                    onClick={() => setActiveTab('wallet')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'wallet' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                    Billetera
                </button>
            </div>

            {activeTab === 'wallet' ? (
                <div className="w-full">
                    <Wallet />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    {/* Left Column: Avatar & Quick Stats */}
                    <div className="liquid-glass p-6 rounded-2xl flex flex-col items-center text-center h-fit">
                        <div className="relative group mb-4">
                            <div
                                className="w-32 h-32 rounded-full bg-cover bg-center border-2 border-white/20 shadow-2xl relative"
                                style={{ backgroundImage: `url(${profile.image})` }}
                            >
                                <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                        {profile.elo > 0 && <p className="text-gold font-mono text-sm mb-4">ELO {profile.elo}</p>}

                        <div className="w-full pt-4 border-t border-white/5 space-y-2">
                            <div className="flex justify-between text-xs text-text-muted">
                                <span>ID Usuario</span>
                                <span className="font-mono text-white opacity-50 truncate max-w-[100px]">{currentUserId}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Edit Form */}
                    <div className="md:col-span-2 liquid-glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <User size={18} className="text-gold" /> {t('profile.personal_info')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('profile.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    className="input-premium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('profile.bio')}</label>
                                <textarea
                                    name="bio"
                                    value={profile.bio || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    className="input-premium resize-none"
                                    placeholder="Cuéntanos sobre tu experiencia en ajedrez..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('profile.avatar_url')}</label>
                                <input
                                    type="text"
                                    name="image"
                                    value={profile.image}
                                    onChange={handleChange}
                                    className="input-premium text-xs font-mono"
                                />
                                <p className="text-[10px] text-text-muted mt-1">Usa una URL de imagen válida (ej. Unsplash).</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="btn-primary flex items-center gap-2 px-8 py-3 liquid-shimmer"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Save size={18} /> {t('profile.save')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default UserProfile;
