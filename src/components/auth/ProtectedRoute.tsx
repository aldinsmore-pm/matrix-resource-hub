
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

  // Immediately check for session in localStorage to avoid showing the loading state unnecessarily
  const hasLocalSession = Boolean(localStorage.getItem('supabase.auth.token'));
  
  useEffect(() => {
    // If no local session exists, skip the auth check
    if (!hasLocalSession) {
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Set a timeout to prevent infinite loading
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("Authentication check timed out after 5 seconds");
        setAuthError("Authentication check timed out. Please try logging in again.");
        setLoading(false);
      }
    }, 5000); // 5 second timeout - shorter for better UX

    async function checkAuth() {
      try {
        console.log("ProtectedRoute: Checking authentication...");
        
        // Simple direct session check
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.log("No valid session found:", sessionError?.message || "Session missing");
          
          if (isMounted) {
            setUser(null);
            clearTimeout(authTimeout);
            setLoading(false);
          }
          return;
        }
        
        // We have a valid session, set the user
        if (isMounted) {
          setUser(sessionData.session.user);
          
          // Check subscription if needed
          if (requireSubscription) {
            try {
              const hasActiveSubscription = await isSubscribed();
              if (isMounted) {
                setHasSubscription(hasActiveSubscription);
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
    
    // Clean up function
    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, [requireSubscription, hasLocalSession]);

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
  if (loading && hasLocalSession) {
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
