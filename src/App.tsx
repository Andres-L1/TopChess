import React, { useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { firebaseService } from './services/firebaseService';
import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
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
const LichessCallback = lazy(() => import('./pages/LichessCallback'));
const ClubOffice = lazy(() => import('./pages/ClubOffice'));

// Types
interface AuthContextType {
  userRole: 'student' | 'teacher' | 'admin' | 'club_director' | null;
  setUserRole: (role: 'student' | 'teacher' | 'admin' | 'club_director' | null) => void;
  currentUserId: string;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authError: string | null;
}

// Mock Auth Context
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin' | 'club_director' | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthError(null); // Reset error on state change
      if (user) {
        setCurrentUser(user);
        // Sync with Firestore
        try {
          const dbUser = await firebaseService.getUser(user.uid);

          if (dbUser) {
            setUserRole(dbUser.role);
          } else {
            // If getUser returns null (NOT error), it means user is authenticated but has no profile -> Onboarding
            console.warn("User exists in Auth but not in Firestore");
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error syncing user profile:", error);
          setAuthError("Error de conexión al cargar tu perfil. Revisa tu internet.");
          // Do NOT set userRole to null here blindly if it's a connection error
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Presence Tracking moved to AnimatedRoutes to be route-aware
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
      if (currentUser) {
        await firebaseService.updateUserPresence(currentUser.uid, 'offline');
      }
      await signOut(auth);
      setUserRole(null);
      setCurrentUser(null);
      setAuthError(null);
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const currentUserId = currentUser ? currentUser.uid : '';
  const isAuthenticated = !!currentUser;

  if (loading) return <LoadingSpinner />;

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, currentUserId, isAuthenticated, currentUser, loginWithGoogle, logout, loading, authError }}>
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        const adminStatus = await firebaseService.isAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [currentUser]);

  if (isAdmin === null) return <LoadingSpinner />;

  return isAdmin ? children : <Navigate to="/" />;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#161512] text-gold">
    <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#161512] text-center px-6">
    <div className="text-red-500 mb-4 animate-pulse">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h1 className="text-xl font-bold text-white mb-2">Error de conexión</h1>
    <p className="text-white/50 mb-6 max-w-sm">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-white transition-all uppercase tracking-widest text-xs"
    >
      Reintentar
    </button>
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

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, userRole, loading, authError, currentUser } = useAuth();
  const navigate = useNavigate();

  // Presence Tracking (Route Aware)
  React.useEffect(() => {
    if (!currentUser) return;

    const isClassroom = location.pathname.startsWith('/classroom') || location.pathname.startsWith('/room');

    const updatePresence = (status: 'online' | 'offline') => {
      firebaseService.updateUserPresence(currentUser.uid, status).catch(console.error);
    };

    if (!isClassroom) {
      updatePresence('online');
    }

    const handleVisibilityChange = () => {
      if (isClassroom) return; // Prevent overwriting in_class state

      if (document.visibilityState === 'visible') {
        updatePresence('online');
      } else {
        updatePresence('offline');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, location.pathname]);

  React.useEffect(() => {
    if (!loading && !authError) {
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
  }, [loading, isAuthenticated, userRole, location.pathname, navigate, authError]);

  if (authError) {
    return <ErrorScreen message={authError} />;
  }

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
        <Route path="/office" element={<PrivateRoute><PageTransition><ClubOffice /></PageTransition></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
        <Route path="/lichess-callback" element={<PageTransition><LichessCallback /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isClassroom = location.pathname.includes('/classroom/') || location.pathname.includes('/room/');

  return (
    <div className="min-h-screen bg-[#161512] text-[#bababa] font-sans">
      {!isClassroom && <Navbar />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1b1a17',
            color: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#D4AF37', // Gold 
              secondary: '#1b1a17',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1b1a17',
            },
          },
        }}
      />
      <main className={isClassroom ? '' : 'pt-16'}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <AnimatedRoutes />
          </Suspense>
        </Layout>
      </AuthProvider>
    </Router>
  );
}



export default App;
