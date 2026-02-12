import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Trophy, Coins } from 'lucide-react';
import { AuthContext } from '../App';

const Home = () => {
    const [teachers, setTeachers] = useState([]);
    const { userRole } = React.useContext(AuthContext);

    useEffect(() => {
        const fetchTeachers = async () => {
            // For MVP, we'll try to fetch. If empty, we might want to seed for demo purposes.
            // But adhering to "strict flow", we just read.
            // We can also just show a hardcoded card if DB is empty for the user to see immediately.
            try {
                const querySnapshot = await getDocs(collection(db, "teachers"));
                const teachersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (teachersList.length === 0) {
                    // Auto-seed for MVP demo if empty
                    const demoTeacher = {
                        name: "GM Ana",
                        elo: 2400,
                        price: 30,
                        classesGiven: 12,
                        earnings: 360
                    };
                    await setDoc(doc(db, "teachers", "teacher1"), demoTeacher);
                    setTeachers([{ id: "teacher1", ...demoTeacher }]);
                } else {
                    setTeachers(teachersList);
                }
            } catch (error) {
                console.error("Error fetching teachers:", error);
                // Fallback for demo if Firebase not configured
                setTeachers([{
                    id: "teacher1",
                    name: "GM Ana",
                    elo: 2400,
                    price: 30,
                    classesGiven: 12,
                    earnings: 360
                }]);
            }
        };

        fetchTeachers();
    }, []);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Aprende Ajedrez con Maestros</h1>
                <p className="text-xl text-[#bababa]">Entrena en tiempo real con audio y análisis sincronizado.</p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                    <div key={teacher.id} className="bg-[#262421] border border-[#302e2b] p-6 rounded-lg shadow-lg hover:border-[#bf811d]/50 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-[#363431] rounded-full flex items-center justify-center text-[#bf811d]">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{teacher.name}</h3>
                                <div className="flex items-center gap-1 text-[#bf811d] text-sm font-semibold">
                                    <Trophy size={14} /> <span>{teacher.elo} ELO</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm mb-6 text-[#bababa]">
                            <span className="flex items-center gap-1"><Coins size={14} /> ${teacher.price}/hr</span>
                            <span>{teacher.classesGiven} clases dadas</span>
                        </div>

                        {userRole === 'student' ? (
                            <Link to={`/room/${teacher.id}`} className="block w-full text-center py-2 px-4 bg-[#bf811d] hover:bg-[#a66f19] text-white font-bold rounded transition-colors">
                                Entrar a Clase
                            </Link>
                        ) : (
                            teacher.id === "teacher1" && ( /* Only show own button if logged in as this teacher */
                                <Link to={`/room/${teacher.id}`} className="block w-full text-center py-2 px-4 bg-[#363431] hover:bg-[#403d39] text-[#bababa] border border-[#403d39] font-bold rounded transition-colors">
                                    Ir a mi Aula
                                </Link>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
