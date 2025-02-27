
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, isSubscribed } from "../../lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        
        // If user is authenticated and subscription is required, check subscription
        if (data.user && requireSubscription) {
          const subscribed = await isSubscribed();
          setHasSubscription(subscribed);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user && requireSubscription) {
          const subscribed = await isSubscribed();
          setHasSubscription(subscribed);
        }
      }
    );
    
    return () => {
      // Clean up the subscription
      authListener.subscription.unsubscribe();
    };
  }, [requireSubscription]);

  // Show loading state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // User is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is logged in but doesn't have a subscription and it's required
  if (requireSubscription && !hasSubscription) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has required subscription or it's not required
  return <>{children}</>;
};

export default ProtectedRoute;
