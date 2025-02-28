
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payment from "./pages/Payment";

import { supabase, isSubscribed } from "./lib/supabase";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("ProtectedRoute: Checking authentication...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("ProtectedRoute: Error getting session:", sessionError);
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        
        if (!sessionData.session) {
          console.log("ProtectedRoute: No active session found, redirecting to login");
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Double-check by getting the user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.log("ProtectedRoute: No user found or error, redirecting to login");
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log("ProtectedRoute: User authenticated:", userData.user.id);
        setAuthenticated(true);
        
        // Check subscription status
        console.log("ProtectedRoute: Checking subscription status");
        const hasSubscription = await isSubscribed();
        console.log("ProtectedRoute: Subscription status:", hasSubscription);
        setSubscribed(hasSubscription);
      } catch (error) {
        console.error("ProtectedRoute: Error checking authentication:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("ProtectedRoute: Timeout reached, stopping loading state");
        setLoading(false);
        setAuthenticated(false);
      }
    }, 5000); // 5 second timeout

    checkAuth();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("ProtectedRoute: Auth state changed:", event);
        if (session) {
          console.log("ProtectedRoute: New session established for user:", session.user.id);
          setAuthenticated(true);
          const hasSubscription = await isSubscribed();
          setSubscribed(hasSubscription);
        } else {
          console.log("ProtectedRoute: Session ended");
          setAuthenticated(false);
          setSubscribed(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!subscribed) {
    console.log("ProtectedRoute: No active purchase, redirecting to payment page");
    return <Navigate to="/payment" replace />;
  }

  return children;
};

const App = () => {
  const [session, setSession] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("App: Initializing authentication");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("App: Error getting session:", error);
        } else {
          console.log("App: Session status:", data.session ? "Active session" : "No active session");
          setSession(data.session);
        }
        
        // Set up auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("App: Auth state changed, new session:", session ? "Active" : "None");
          setSession(session);
        });
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("App: Error initializing auth:", error);
      } finally {
        setAppReady(true);
      }
    };
    
    initializeAuth();

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!appReady) {
        console.log("App: Timeout reached for app initialization, forcing ready state");
        setAppReady(true);
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Loading app...</p>
        </div>
      </div>
    );
  }

  // Wrap everything in a try-catch to help debug rendering issues
  try {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          {/* Redirect /subscription to /payment if anyone tries to access it */}
          <Route path="/subscription" element={<Navigate to="/payment" replace />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors closeButton />
      </Router>
    );
  } catch (error) {
    console.error("Critical rendering error in App component:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center p-4">
          <h2 className="text-xl text-red-500 mb-4">Application Error</h2>
          <p className="text-white mb-4">We encountered a problem while loading the application.</p>
          <p className="text-gray-400 text-sm mb-4">Technical details: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
};

export default App;
