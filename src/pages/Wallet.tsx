import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Send, Download, Sparkles, AlertCircle, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { Transaction } from '../types/index';
import toast from 'react-hot-toast';

interface WalletData {
    balance: number;
    currency: string;
}

const Wallet: React.FC = () => {
    const { currentUserId, userRole, currentUser } = useAuth();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<WalletData>({ balance: 0, currency: 'EUR' });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState(50);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = () => {
        setIsLoading(true);
        const unsubWallet = firebaseService.observeWallet(currentUserId, (walletData) => {
            setWallet(walletData);
        });
        const unsubTxs = firebaseService.observeTransactions(currentUserId, (txs) => {
            setTransactions(txs);
            setIsLoading(false);
        });

        return () => {
            unsubWallet();
            unsubTxs();
        };
    };

    useEffect(() => {
        if (currentUserId) {
            return loadData();
        }
    }, [currentUserId]);

    const handleDeposit = async () => {
        try {
            await firebaseService.addFunds(currentUserId, Number(depositAmount));
            setShowDepositModal(false);
            toast.success(`Recarga de ${depositAmount}€ completada`, { icon: '💰' });
        } catch (error) {
            console.error("Error depositing funds", error);
            toast.error("Error en la recarga");
        }
    };

    return (
        <div className="min-h-screen bg-[#111] text-[#e0e0d1] font-sans pb-20 selection:bg-gold/30 selection:text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#111]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        Mi Billetera <Sparkles size={16} className="text-gold" />
                    </h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-transparent border border-gold/10 flex items-center justify-center p-1 overflow-hidden">
                    <img src={currentUser?.photoURL || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
                {/* Virtual Card (Fintech Style) */}
                <div className="relative w-full aspect-[1.586/1] max-w-md mx-auto rounded-3xl p-8 mb-8 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-transform duration-500 hover:scale-[1.02]">
                    {/* Dynamic Backgrounds */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#111] z-0"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold/20 transition-colors duration-700 z-0"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 z-0"></div>

                    {/* Card Content */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <Logo className="w-10 h-10 text-white drop-shadow-lg" />
                            <div className="flex gap-1">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md"></div>
                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md -ml-4"></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Saldo Disponible</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                                    {isLoading ? "..." : wallet.balance.toFixed(2)}
                                </span>
                                <span className="text-2xl text-white/50 font-bold">{wallet.currency}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Titular</p>
                                <p className="text-white font-bold tracking-wide">{currentUser?.displayName || 'TopChess User'}</p>
                            </div>
                            <div className="w-12 h-8 rounded bg-gradient-to-r from-yellow-200 to-yellow-500 opacity-80 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-[2px] bg-black/20 absolute"></div>
                                <div className="w-[2px] h-full bg-black/20 absolute"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] hover:bg-[#222] border border-white/5 transition-all active:scale-95 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide">Recargar</span>
                    </button>

                    <button
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] hover:bg-[#222] border border-white/5 transition-all active:scale-95 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Send size={24} />
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide">Enviar</span>
                    </button>

                    <button
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] hover:bg-[#222] border border-white/5 transition-all active:scale-95 group opacity-50 cursor-not-allowed"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 text-white/50 flex items-center justify-center">
                            <Download size={24} />
                        </div>
                        <span className="text-xs font-bold text-white/50 tracking-wide">Retirar</span>
                    </button>
                </div>

                {/* Transactions */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Transacciones Recientes</h3>
                    <button className="text-xs font-bold text-gold hover:text-white transition-colors">Ver Todo</button>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 animate-pulse flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-1/3" />
                                    <div className="h-3 bg-white/5 rounded w-1/4" />
                                </div>
                            </div>
                        ))
                    ) : transactions.length === 0 ? (
                        <div className="text-center p-8 bg-[#1a1a1a] rounded-2xl border border-white/5">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/20">
                                <Clock size={32} />
                            </div>
                            <p className="text-white/50 font-medium">Aún no hay movimientos</p>
                        </div>
                    ) : (
                        transactions.map(tx => {
                            const isPositive = tx.type === 'deposit' || tx.type === 'payment_received';
                            return (
                                <div key={tx.id} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white'
                                            }`}>
                                            {isPositive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm mb-1">{tx.description}</div>
                                            <div className="text-xs text-[#8b8982]">
                                                {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-lg ${isPositive ? 'text-green-500' : 'text-white'}`}>
                                        {isPositive ? '+' : '-'}
                                        {Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end md:items-center justify-center">
                    <div className="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 shadow-2xl overflow-hidden animate-slide-up md:animate-enter">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-400" />
                                Añadir Fondos
                            </h3>
                            <button onClick={() => setShowDepositModal(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-[#8b8982] uppercase mb-3 text-center">Selecciona el importe</label>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[20, 50, 100].map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => setDepositAmount(amt)}
                                            className={`py-3 rounded-xl font-black text-lg transition-all ${depositAmount === amt
                                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105 border-transparent'
                                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {amt}€
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-bold text-xl">€</span>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                                        className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-2xl font-black text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 text-sm text-orange-400 flex items-start gap-3 mb-6">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <p>Modo de Prueba: No se te cobrará dinero real al pulsar el botón.</p>
                            </div>

                            <button onClick={handleDeposit} className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-2xl hover:bg-gray-200 transition-colors active:scale-[0.98]">
                                Confirmar Pago con Tarjeta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;

