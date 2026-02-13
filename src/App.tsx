import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { User, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import { firebaseService } from './services/firebaseService';
import Navbar from './components/Navbar';

import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';



// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Classroom = lazy(() => import('./pages/Classroom'));
const Chat = lazy(() => import('./pages/Chat'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Wallet = lazy(() => import('./pages/Wallet'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Types
interface AuthContextType {
  userRole: 'student' | 'teacher' | null;
  setUserRole: (role: 'student' | 'teacher' | null) => void;
  currentUserId: string;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Mock Auth Context
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null); // Default to null to force check
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync with Firestore
        try {
          const dbUser = await firebaseService.getUser(user.uid);
          if (dbUser) {
            setUserRole(dbUser.role);
            toast.success(`Bienvenido de nuevo, ${dbUser.name}`);
          } else {
            // New User -> Don't create yet, let them choose role in Onboarding
            setUserRole(null);
            // We can't navigate here easily as we are in provider, but the routes will handle it
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          toast.error("Error al sincronizar perfil");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Error al iniciar sesión");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const currentUserId = currentUser ? currentUser.uid : '';
  const isAuthenticated = !!currentUser;

  if (loading) return <LoadingSpinner />;

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, currentUserId, isAuthenticated, currentUser, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser } = useAuth();
  if (currentUser?.email === 'andreslgumuzio@gmail.com') {
    return children;
  }
  return <Navigate to="/" />;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#161512] text-gold">
    <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
  </div>
);

// Page Transition Wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Separate component to use useLocation hook
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, userRole, loading } = useAuth(); // Need loading state from AuthContext
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && isAuthenticated && userRole === null && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [loading, isAuthenticated, userRole, location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/chat/:teacherId" element={<PrivateRoute><PageTransition><Chat /></PageTransition></PrivateRoute>} />
        <Route path="/room/:teacherId" element={<PrivateRoute><PageTransition><Classroom /></PageTransition></PrivateRoute>} />
        <Route path="/classroom/:teacherId" element={<PrivateRoute><PageTransition><Classroom /></PageTransition></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><PageTransition><TeacherDashboard /></PageTransition></PrivateRoute>} />
        <Route path="/student-dashboard" element={<PrivateRoute><PageTransition><StudentDashboard /></PageTransition></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><PageTransition><Wallet /></PageTransition></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><PageTransition><UserProfile /></PageTransition></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {

  return (
    <AuthProvider>
      <Router basename="/TopChess">
        <div className="min-h-screen bg-[#161512] text-[#bababa] font-sans">
          <Navbar />
          <Toaster position="top-center" />
          <main className="pt-16">
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedRoutes />
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}



export default App;
