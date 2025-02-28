
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
    
    console.log("ProtectedRoute: Mounting component...");
    
    // Set a timeout to prevent infinite loading
    authTimeout = setTimeout(() => {
      if (isMounted) {
        console.error("ProtectedRoute: Authentication check timed out after 3 seconds");
        setAuthError("Authentication check timed out. Please try logging in again.");
        setLoading(false);
      }
    }, 3000); // 3 second timeout for better UX
    
    const checkAuth = async () => {
      try {
        console.log("ProtectedRoute: Checking authentication...");
        
        // Get the current session from Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Clear timeout as we got a response
        clearTimeout(authTimeout);
        
        if (sessionError) {
          console.error("ProtectedRoute: Session error:", sessionError);
          
          if (isMounted) {
            setAuthError(sessionError.message);
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        // No session found
        if (!sessionData.session) {
          console.log("ProtectedRoute: No valid session found");
          
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        // We have a valid session
        console.log("ProtectedRoute: Valid session found");
        
        if (isMounted) {
          setUser(sessionData.session.user);
          
          // Check subscription if needed
          if (requireSubscription) {
            try {
              console.log("ProtectedRoute: Checking subscription...");
              const hasActiveSubscription = await isSubscribed();
              
              if (isMounted) {
                setHasSubscription(hasActiveSubscription);
              }
              
              console.log("ProtectedRoute: Subscription status:", hasActiveSubscription);
            } catch (subError) {
              console.error("ProtectedRoute: Subscription check error:", subError);
              
              if (isMounted) {
                setHasSubscription(false);
              }
            }
          }
          
          setLoading(false);
        }
      } catch (error: any) {
        console.error("ProtectedRoute: Authentication check error:", error);
        
        if (isMounted) {
          setAuthError(error.message);
          setUser(null);
          setLoading(false);
        }
      }
    };
    
    // Execute auth check
    checkAuth();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("ProtectedRoute: Auth state changed:", event);
        
        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setHasSubscription(false);
          }
        } else if (event === 'SIGNED_IN' && session) {
          if (isMounted) {
            setUser(session.user);
            
            if (requireSubscription) {
              const hasActiveSubscription = await isSubscribed();
              if (isMounted) {
                setHasSubscription(hasActiveSubscription);
              }
            }
          }
        }
      }
    );
    
    // Cleanup on unmount
    return () => {
      console.log("ProtectedRoute: Unmounting, cleaning up...");
      isMounted = false;
      clearTimeout(authTimeout);
      authListener.subscription.unsubscribe();
    };
  }, [requireSubscription, location]);

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
            onClick={() => {
              // Clear any stale session data
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('session_active');
              window.location.href = "/login";
            }}
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
        <div className="mb-4">Verifying authentication...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // User is not logged in, redirect to login
  if (!user) {
    console.log("ProtectedRoute: No authenticated user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is logged in but doesn't have a subscription and it's required
  if (requireSubscription && !hasSubscription) {
    console.log("ProtectedRoute: User lacks subscription, redirecting to subscription page");
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has required subscription or it's not required
  console.log("ProtectedRoute: Access granted to protected route");
  return <>{children}</>;
};

export default ProtectedRoute;
