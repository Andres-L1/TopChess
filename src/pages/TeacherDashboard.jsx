import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../App';
import { DollarSign, BookOpen, TrendingUp } from 'lucide-react';

const TeacherDashboard = () => {
    const { userRole, currentUserId } = React.useContext(AuthContext);
    const [teacherData, setTeacherData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'teacher') return;

        const fetchData = async () => {
            const docRef = doc(db, "teachers", currentUserId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setTeacherData(docSnap.data());
            }
            setLoading(false);
        };

        fetchData();
    }, [userRole, currentUserId]);

    const calculateCommission = (classesGiven) => {
        if (classesGiven <= 20) return 0.60;
        if (classesGiven <= 50) return 0.70;
        return 0.80;
    };

    const handleFinishClass = async () => {
        if (!teacherData) return;

        const commissionRate = calculateCommission(teacherData.classesGiven + 1); // Calculate based on new total? Or current? "Se recalcula...". Usually applies to the class just given.
        // Let's assume the rate applies to the current class.
        // Actually, user said: "Se incrementa classesGiven... Se recalcula %... Se suma dinero".
        // Let's use the tier of the class being finished.
        // If I have 20 classes, this is my 21st.
        // Rate for 21-50 is 70%.
        // So if I finish my 21st class, I get 70%? Or was 20 limit?
        // "0-20 classes: 60%". So class 1..20 is 60%. Class 21 is 70%.

        const currentCount = teacherData.classesGiven;
        const newCount = currentCount + 1;

        let rate = 0.60;
        if (newCount > 50) rate = 0.80;
        else if (newCount > 20) rate = 0.70;

        const price = teacherData.price;
        const earned = price * rate;

        try {
            const docRef = doc(db, "teachers", currentUserId);
            await updateDoc(docRef, {
                classesGiven: increment(1),
                earnings: increment(earned)
            });

            // Optimistic update
            setTeacherData(prev => ({
                ...prev,
                classesGiven: newCount,
                earnings: prev.earnings + earned
            }));

            alert(`Clase terminada! Ganaste $${earned.toFixed(2)} (${rate * 100}%)`);
        } catch (error) {
            console.error("Error updating stats:", error);
            alert("Error al terminar la clase");
        }
    };

    if (userRole !== 'teacher') {
        return <div className="text-center mt-10 text-xl">Acceso denegado. <br /><span className="text-sm text-[#bababa]">Debes ser profesor.</span></div>;
    }

    if (loading) return <div className="text-center mt-10">Cargando panel...</div>;
    if (!teacherData) return <div className="text-center mt-10">No se encontraron datos del profesor.</div>;

    const currentRate = calculateCommission(teacherData.classesGiven + 1);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Panel de Profesor ({teacherData.name})</h1>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#262421] p-6 rounded-lg border border-[#302e2b]">
                    <div className="flex items-center gap-3 text-[#bf811d] mb-2">
                        <DollarSign /> <span className="font-bold">Ganancias Totales</span>
                    </div>
                    <p className="text-3xl text-white">${teacherData.earnings.toFixed(2)}</p>
                </div>

                <div className="bg-[#262421] p-6 rounded-lg border border-[#302e2b]">
                    <div className="flex items-center gap-3 text-[#bf811d] mb-2">
                        <BookOpen /> <span className="font-bold">Clases Dadas</span>
                    </div>
                    <p className="text-3xl text-white">{teacherData.classesGiven}</p>
                </div>

                <div className="bg-[#262421] p-6 rounded-lg border border-[#302e2b]">
                    <div className="flex items-center gap-3 text-[#bf811d] mb-2">
                        <TrendingUp /> <span className="font-bold">Nivel de Comisión</span>
                    </div>
                    <p className="text-3xl text-white">{(currentRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-[#bababa] mt-2">
                        {teacherData.classesGiven <= 20 ? `Faltan ${21 - teacherData.classesGiven} para 70%` :
                            teacherData.classesGiven <= 50 ? `Faltan ${51 - teacherData.classesGiven} para 80%` : "Nivel Máximo"}
                    </p>
                </div>
            </div>

            <div className="bg-[#262421] p-8 rounded-lg border border-[#302e2b] text-center">
                <h2 className="text-xl font-bold text-white mb-4">Control de Clase</h2>
                <p className="mb-6">Al terminar una clase, se registrará y se sumará el saldo a tu cuenta.</p>
                <button
                    onClick={handleFinishClass}
                    className="bg-[#bf811d] hover:bg-[#a66f19] text-white font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-900/20"
                >
                    Terminar Clase Actual
                </button>
            </div>
        </div>
    );
};

export default TeacherDashboard;
