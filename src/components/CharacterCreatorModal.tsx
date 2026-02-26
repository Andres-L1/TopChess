import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Save } from 'lucide-react';
import { AvatarConfig } from '../types';
import DynamicAvatar, { DEFAULT_AVATAR_CONFIG } from './DynamicAvatar';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

// Color Options
const SKIN_COLORS = ['#ffcca6', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#3d2210'];
const HAIR_COLORS = ['#27272a', '#4a3000', '#78350f', '#facc15', '#b91c1c', '#60a5fa', '#a855f7', '#9ca3af', '#ef4444'];
const HAIR_STYLES = ['short', 'long', 'spiky', 'bald'];
const SHIRT_COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#111827', '#ffffff', '#ec4899'];
const PANTS_COLORS = ['#1e293b', '#2563eb', '#374151', '#9ca3af', '#451a03', '#166534'];
const SHOES_COLORS = ['#000000', '#ffffff', '#7f1d1d', '#1e3a8a'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialConfig?: AvatarConfig;
    onSaved?: (newConfig: AvatarConfig) => void;
}

const ColorPicker: React.FC<{ label: string, colors: string[], selected: string, onChange: (c: string) => void }> = ({ label, colors, selected, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${selected === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    </div>
);

const StylePicker: React.FC<{ label: string, styles: string[], selected: string, onChange: (s: string) => void }> = ({ label, styles, selected, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
            {styles.map(s => (
                <button
                    key={s}
                    onClick={() => onChange(s)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors capitalize text-sm font-medium ${selected === s ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    {s}
                </button>
            ))}
        </div>
    </div>
);

const CharacterCreatorModal: React.FC<Props> = ({ isOpen, onClose, initialConfig, onSaved }) => {
    const { currentUser, userRole } = useAuth();
    const [config, setConfig] = useState<AvatarConfig>(initialConfig || DEFAULT_AVATAR_CONFIG);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        try {
            await firebaseService.updateUser(currentUser.uid, { avatar: config });
            toast.success('Avatar guardado correctamente');
            if (onSaved) onSaved(config);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar el avatar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-[#1A1A1A] w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Left Side: Preview */}
                    <div className="md:w-1/3 bg-black/50 p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-white/10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Tu Avatar</h2>
                            <p className="text-gray-400 text-sm">Crea tu identidad virtual en TopChess World</p>
                        </div>

                        {/* Avatar Display */}
                        <div className="w-48 h-64 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl border border-white/5 shadow-inner flex items-center justify-center relative overflow-hidden">
                            <DynamicAvatar
                                config={config}
                                role={userRole || 'student'}
                                name={currentUser?.displayName || 'Usuario'}
                                elo={1200} // Placeholder for preview
                                earnings={150} // Placeholder for preview
                                scale={2.5}
                            />
                        </div>
                    </div>

                    {/* Right Side: Controls */}
                    <div className="md:w-2/3 p-6 md:p-8 overflow-y-auto max-h-[80vh]">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">1</span>
                                    Cuerpo y Cabeza
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <ColorPicker label="Tono de Piel" colors={SKIN_COLORS} selected={config.skinColor} onChange={(c) => setConfig({ ...config, skinColor: c })} />
                                    <div>
                                        <StylePicker label="Peinado" styles={HAIR_STYLES} selected={config.hairStyle} onChange={(s) => setConfig({ ...config, hairStyle: s })} />
                                        {config.hairStyle !== 'bald' && (
                                            <ColorPicker label="Color de Pelo" colors={HAIR_COLORS} selected={config.hairColor} onChange={(c) => setConfig({ ...config, hairColor: c })} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">2</span>
                                    Ropa
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <ColorPicker label="Camiseta" colors={SHIRT_COLORS} selected={config.shirtColor} onChange={(c) => setConfig({ ...config, shirtColor: c })} />
                                    <ColorPicker label="Pantalones" colors={PANTS_COLORS} selected={config.pantsColor} onChange={(c) => setConfig({ ...config, pantsColor: c })} />
                                    <ColorPicker label="Zapatos" colors={SHOES_COLORS} selected={config.shoesColor} onChange={(c) => setConfig({ ...config, shoesColor: c })} />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all mr-3"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CharacterCreatorModal;
