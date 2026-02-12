import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, GraduationCap, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import Classroom from './pages/Classroom';
import Chat from './pages/Chat';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Wallet from './pages/Wallet';

// Mock Auth Context - simplified for MVP requirements
export const AuthContext = React.createContext();

// A simple AuthProvider for demonstration purposes, based on the userRole
const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('student'); // 'student' or 'teacher'
  const currentUserId = userRole === 'teacher' ? 'teacher1' : 'student1';
  const isAuthenticated = true; // For now, always authenticated for demo purposes

  const logout = () => {
    setUserRole(null);
    // In a real app, this would clear tokens
  };

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, currentUserId, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router basename="/TopChess">
        <div className="min-h-screen bg-[#161512] text-[#bababa] font-sans">
          <Navbar />
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat/:teacherId" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/room/:teacherId" element={<PrivateRoute><Classroom /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><TeacherDashboard /></PrivateRoute>} />
              <Route path="/student-dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
              <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function Navbar() {
  const { userRole, setUserRole } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = import.meta.env.SSR ? { pathname: '/' } : window.location; // Fallback for location checking
  // Better use useLocation from react-router-dom
  const reactLocation = (function UseLoc() {
    try { return window.location.pathname; } catch (e) { return '/'; }
  })();

  const isClassroom = reactLocation.includes('/room/');

  return (
    <nav className="bg-[#262421] border-b border-[#302e2b] p-4 flex justify-between items-center h-16 shadow-lg z-50">
      <Link to="/" className="text-xl font-bold flex items-center gap-2 text-[#bababa] hover:text-white transition-colors">
        <span className="text-2xl">♟️</span> AjedrezTopChess
      </Link>

      <div className="flex items-center gap-6">
        {!isClassroom && (
          <div className="flex bg-[#161512] rounded-lg p-1 border border-[#302e2b]">
            <button
              onClick={() => {
                setUserRole('student');
                navigate('/student-dashboard');
              }}
              className={`px-4 py-1 rounded-md text-sm transition-all ${userRole === 'student' ? 'bg-[#363431] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}
            >
              Soy Alumno
            </button>
            <button
              onClick={() => {
                setUserRole('teacher');
                navigate('/dashboard');
              }}
              className={`px-4 py-1 rounded-md text-sm transition-all ${userRole === 'teacher' ? 'bg-[#363431] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}
            >
              Soy Profesor
            </button>
          </div>
        )}

        {userRole === 'teacher' && (
          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded bg-[#363431] hover:bg-[#403d39] text-[#bababa] hover:text-white transition-colors font-medium text-sm">
            <LayoutDashboard size={18} />
            Panel
          </Link>
        )}
      </div>
    </nav>
  );
}

export default App;
