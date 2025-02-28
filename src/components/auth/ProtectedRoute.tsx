
// Ensure protected routes properly redirect when a user logs out
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase, isSubscribed } from "../../lib/supabase";

interface ProtectedRouteProps {
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
}

const ProtectedRoute = ({ 
  requiresAuth = true, 
  requiresSubscription = false 
}: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkAuthAndSubscription() {
      try {
        // Check authentication
        const { data } = await supabase.auth.getUser();
        const isAuthValid = !!data.user;
        setIsAuthenticated(isAuthValid);
        
        // If authenticated and subscription is required, check subscription
        if (isAuthValid && requiresSubscription) {
          const subscribed = await isSubscribed();
          setHasActiveSubscription(subscribed);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthAndSubscription();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isAuthValid = !!session;
        setIsAuthenticated(isAuthValid);
        
        if (isAuthValid && requiresSubscription) {
          const subscribed = await isSubscribed();
          setHasActiveSubscription(subscribed);
        } else if (!isAuthValid) {
          setHasActiveSubscription(false);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [requiresAuth, requiresSubscription]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login page if authentication is required but user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresSubscription && !hasActiveSubscription) {
    // Redirect to subscription page if subscription is required but user doesn't have one
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  // If all requirements are met, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
