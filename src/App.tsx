
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
import Payment from "./pages/Payment"; // Import Payment component

import { supabase, isSubscribed } from "./lib/supabase";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("ProtectedRoute: Checking authentication...");
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          console.log("ProtectedRoute: No user found or error, redirecting to login");
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log("ProtectedRoute: User authenticated, checking subscription");
        setAuthenticated(true);
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
        setAuthenticated(!!session);
        if (session) {
          const hasSubscription = await isSubscribed();
          setSubscribed(hasSubscription);
        } else {
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

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
};

export default App;
