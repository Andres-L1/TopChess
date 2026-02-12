import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, GraduationCap, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import Classroom from './pages/Classroom';
import TeacherDashboard from './pages/TeacherDashboard';

// Mock Auth Context - simplified for MVP requirements
export const AuthContext = React.createContext();

function App() {
  const [userRole, setUserRole] = useState('student'); // 'student' or 'teacher'
  const currentUserId = userRole === 'teacher' ? 'teacher1' : 'student1';

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, currentUserId }}>
      <Router>
        <div className="min-h-screen bg-[#161512] text-[#bababa] font-sans">
          <Navbar />
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/room/:teacherId" element={<Classroom />} />
              <Route path="/dashboard" element={<TeacherDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

function Navbar() {
  const { userRole, setUserRole } = React.useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="bg-[#262421] border-b border-[#302e2b] p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold flex items-center gap-2 text-[#bababa] hover:text-white transition-colors">
        <span className="text-2xl">♟️</span> AjedrezTopChess
      </Link>

      <div className="flex items-center gap-6">
        <div className="flex bg-[#161512] rounded-lg p-1">
          <button
            onClick={() => setUserRole('student')}
            className={`px-4 py-1 rounded-md text-sm transition-all ${userRole === 'student' ? 'bg-[#363431] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}
          >
            Soy Alumno
          </button>
          <button
            onClick={() => setUserRole('teacher')}
            className={`px-4 py-1 rounded-md text-sm transition-all ${userRole === 'teacher' ? 'bg-[#363431] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}
          >
            Soy Profesor
          </button>
        </div>

        {userRole === 'teacher' && (
          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded bg-[#363431] hover:bg-[#403d39] text-[#bababa] hover:text-white transition-colors">
            <LayoutDashboard size={18} />
            Panel
          </Link>
        )}
      </div>
    </nav>
  );
}

export default App;
