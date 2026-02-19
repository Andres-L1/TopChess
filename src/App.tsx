import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { firebaseService } from './services/firebaseService';
import Navbar from './components/Navbar';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
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
const LichessCallback = lazy(() => import('./pages/LichessCallback'));

// Types
interface AuthContextType {
  userRole: 'student' | 'teacher' | null;
  setUserRole: (role: 'student' | 'teacher' | null) => void;
  currentUserId: string;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<void>;
  loginAsTest: (role: 'student' | 'teacher') => Promise<void>;
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
    // Handle redirect result first (Google sign-in redirect flow)
    getRedirectResult(auth).catch(() => {
      // Ignore redirect errors silently (e.g. no pending redirect)
    });

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
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Error al iniciar sesión");
    }
  };

  const loginAsTest = async (role: 'student' | 'teacher') => {
    if (!import.meta.env.DEV) {
      toast.error('Función solo disponible en desarrollo');
      return;
    }
    try {
      setLoading(true);
      const testUid = `test_${role}_123`;
      const mockUser = {
        uid: testUid,
        email: `${role}@test.com`,
        displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        photoURL: `https://ui-avatars.com/api/?name=Test+${role}&background=random`
      } as FirebaseUser;

      // Mock the successful login
      setCurrentUser(mockUser);

      // Ensure the user exists in Firestore mock-wise or real-wise
      const dbUser = await firebaseService.getUser(testUid);
      if (!dbUser) {
        await firebaseService.createUser({
          id: testUid,
          name: mockUser.displayName || 'Test User',
          email: mockUser.email || '',
          role: role,
          photoURL: mockUser.photoURL || '',
          walletBalance: 100,
          status: 'active',
          createdAt: Date.now(),
          currency: 'EUR'
        });
      }

      setUserRole(role);
      toast.success(`Iniciado como ${role} de prueba`);
    } catch (error) {
      console.error("Test login failed", error);
      toast.error("Error en login de prueba");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setCurrentUser(null);
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const currentUserId = currentUser ? currentUser.uid : '';
  const isAuthenticated = !!currentUser;

  if (loading) return <LoadingSpinner />;

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, currentUserId, isAuthenticated, currentUser, loginWithGoogle, loginAsTest, logout, loading }}>
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

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-8xl font-black text-gold/20 mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
      <p className="text-white/40 mb-8 max-w-sm">La página que buscas no existe o ha sido movida.</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-gold text-black font-black rounded-xl hover:bg-white transition-all"
      >
        Volver al inicio
      </button>
    </div>
  );
};

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
    if (!loading) {
      if (!isAuthenticated) {
        if (location.pathname === '/onboarding') {
          navigate('/');
        }
      } else {
        if (userRole === null && location.pathname !== '/onboarding') {
          navigate('/onboarding');
        } else if (userRole !== null && location.pathname === '/onboarding') {
          navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard');
        }
      }
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
        <Route path="/lichess-callback" element={<PageTransition><LichessCallback /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router
      basename="/TopChess"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <div className="min-h-screen bg-[#161512] text-[#bababa] font-sans">
          <Navbar />
          <Toaster position="top-center" />
          <main className="pt-16">
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedRoutes />
            </Suspense>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}



export default App;
