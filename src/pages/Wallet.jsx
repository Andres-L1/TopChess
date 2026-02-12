import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Clock, CreditCard } from 'lucide-react';
import Logo from '../components/Logo';

const Wallet = () => {
    const { currentUserId, userRole } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [wallet, setWallet] = useState({ balance: 0, currency: 'EUR' });
    const [transactions, setTransactions] = useState([]);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState(50);

    const loadData = () => {
        setWallet(mockDB.getWallet(currentUserId));
        setTransactions(mockDB.getTransactions(currentUserId));
    };

    useEffect(() => {
        loadData();

        const handler = () => loadData();
        window.addEventListener('wallet-update', handler);
        return () => window.removeEventListener('wallet-update', handler);
    }, [currentUserId]);

    const handleDeposit = () => {
        mockDB.addFunds(currentUserId, parseInt(depositAmount));
        setShowDepositModal(false);
    };

    return (
        <div className="min-h-screen bg-[#161512] text-[#e0e0d1] font-sans selection:bg-[#D4AF37] selection:text-black">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#262421]/50 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
                    <Logo className="w-8 h-8 text-[#D4AF37]" />
                    <h1 className="text-xl font-bold tracking-tight text-white">Mi <span className="text-[#D4AF37]">Billetera</span></h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-[#262421] to-[#1a1917] p-8 rounded-3xl border border-white/5 shadow-2xl mb-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <WalletIcon size={150} />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-[#8b8982] uppercase text-xs font-bold tracking-widest mb-2">Saldo Disponible</h2>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-6xl font-black text-white tracking-tight">{wallet.balance.toFixed(2)}</span>
                            <span className="text-xl text-[#D4AF37] font-bold">{wallet.currency}</span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center gap-2 transform active:scale-95"
                            >
                                <Plus size={20} />
                                Recargar Saldo
                            </button>
                            {userRole === 'teacher' && (
                                <button className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2">
                                    <ArrowUpRight size={20} />
                                    Retirar Fondos
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-[#8b8982]" />
                    Historial de Transacciones
                </h3>

                <div className="bg-[#262421]/50 rounded-2xl border border-white/5 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-10 text-center text-[#8b8982] italic">
                            No hay transacciones recientes.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' :
                                                tx.type === 'payment' && tx.toId === currentUserId ? 'bg-green-500/10 text-green-500' :
                                                    'bg-red-500/10 text-red-500'
                                            }`}>
                                            {tx.type === 'deposit' ? <ArrowDownLeft size={18} /> :
                                                tx.type === 'payment' && tx.toId === currentUserId ? <ArrowDownLeft size={18} /> :
                                                    <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{tx.description}</div>
                                            <div className="text-xs text-[#8b8982]">{new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${tx.type === 'deposit' || (tx.type === 'payment' && tx.toId === currentUserId)
                                            ? 'text-green-500' : 'text-white'
                                        }`}>
                                        {tx.type === 'deposit' || (tx.type === 'payment' && tx.toId === currentUserId) ? '+' : '-'}
                                        {tx.amount.toFixed(2)} EUR
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#262421] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-[#D4AF37]" />
                                Recargar Saldo
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8b8982] uppercase mb-2">Cantidad a recargar</label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {[20, 50, 100].map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => setDepositAmount(amt)}
                                            className={`py-2 rounded-lg font-bold border ${amount === amt ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-transparent text-white border-white/20 hover:border-white/50'}`}
                                        >
                                            {amt}€
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-bold">€</span>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="w-full bg-[#1a1917] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-[#D4AF37] font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-xs text-blue-300">
                                ℹ️ Esto es una simulación. No se te cobrará dinero real.
                            </div>
                        </div>
                        <div className="p-4 bg-[#1a1917] flex justify-end gap-3">
                            <button onClick={() => setShowDepositModal(false)} className="px-4 py-2 text-[#8b8982] hover:text-white font-bold transition-colors">Cancelar</button>
                            <button onClick={handleDeposit} className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-white transition-colors shadow-lg">Confirmar Recarga</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
