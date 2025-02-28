
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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Set a timeout to prevent infinite loading
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("Authentication check timed out after 10 seconds");
        setAuthError("Authentication check timed out. Please try refreshing the page.");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    async function checkAuth() {
      try {
        console.log("ProtectedRoute: Checking authentication...");
        
        // Directly check the session without refreshing first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        // Check if we have a session
        if (!sessionData.session) {
          console.log("No active session found");
          if (isMounted) {
            setUser(null);
            setLoading(false);
            clearTimeout(authTimeout);
          }
          return;
        }
        
        // Session exists, get the user
        console.log("Session found, getting user...");
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          throw error;
        }
        
        console.log("Auth data received:", data.user ? "User authenticated" : "No user");
        
        if (isMounted) {
          setUser(data.user);
          
          // If user is authenticated and subscription is required, check subscription
          if (data.user && requireSubscription) {
            console.log("Checking subscription status...");
            try {
              const subscribed = await isSubscribed();
              console.log("Subscription status:", subscribed ? "Active" : "Inactive");
              if (isMounted) {
                setHasSubscription(subscribed);
              }
            } catch (subError) {
              console.error("Subscription check error:", subError);
              if (isMounted) {
                setHasSubscription(false);
              }
            }
          }
          
          clearTimeout(authTimeout);
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Error checking authentication:", error);
        if (isMounted) {
          setAuthError(error.message || "Authentication error occurred");
          setUser(null);
          clearTimeout(authTimeout);
          setLoading(false);
          toast.error("Authentication error. Please try logging in again.");
        }
      }
    }
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (isMounted) {
          clearTimeout(authTimeout);
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setHasSubscription(false);
            setLoading(false);
            return;
          }
          
          if (session) {
            setUser(session.user || null);
            
            if (session.user && requireSubscription) {
              try {
                const subscribed = await isSubscribed();
                if (isMounted) {
                  setHasSubscription(subscribed);
                  setLoading(false);
                }
              } catch (error) {
                console.error("Error checking subscription on auth change:", error);
                if (isMounted) {
                  setHasSubscription(false);
                  setLoading(false);
                }
              }
            } else {
              setLoading(false);
            }
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );
    
    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      // Clean up the subscription
      authListener.subscription.unsubscribe();
    };
  }, [requireSubscription, location.pathname]);

  // Show error state
  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="text-xl mb-4 text-red-500">Authentication Error</div>
        <div className="mb-6 text-center max-w-md px-4">{authError}</div>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-matrix-muted text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = "/login"}
            className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
