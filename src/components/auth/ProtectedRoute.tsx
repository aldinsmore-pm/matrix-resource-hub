
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, isSubscribed } from "../../lib/supabase";
import { toast } from "sonner";

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
        console.log("ProtectedRoute: Checking authentication...");
        // Check if user is authenticated
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          throw error;
        }
        
        console.log("Auth data received:", data.user ? "User authenticated" : "No user");
        setUser(data.user);
        
        // If user is authenticated and subscription is required, check subscription
        if (data.user && requireSubscription) {
          console.log("Checking subscription status...");
          try {
            const subscribed = await isSubscribed();
            console.log("Subscription status:", subscribed ? "Active" : "Inactive");
            setHasSubscription(subscribed);
          } catch (subError) {
            console.error("Subscription check error:", subError);
            setHasSubscription(false);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast.error("Authentication error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setUser(session?.user || null);
        
        if (session?.user && requireSubscription) {
          try {
            const subscribed = await isSubscribed();
            setHasSubscription(subscribed);
          } catch (error) {
            console.error("Error checking subscription on auth change:", error);
            setHasSubscription(false);
          }
        }
      }
    );
    
    return () => {
      // Clean up the subscription
      authListener.subscription.unsubscribe();
    };
  }, [requireSubscription, location.pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Checking authentication...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // User is not logged in, redirect to login
  if (!user) {
    console.log("No authenticated user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is logged in but doesn't have a subscription and it's required
  if (requireSubscription && !hasSubscription) {
    console.log("User lacks subscription, redirecting to subscription page");
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has required subscription or it's not required
  console.log("Access granted to protected route");
  return <>{children}</>;
};

export default ProtectedRoute;
