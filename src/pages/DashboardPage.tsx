
import { useEffect, useState } from "react";
import Dashboard from "../components/dashboard/Dashboard";
import ParticleBackground from "../components/ParticleBackground";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DashboardPage = () => {
  const [loaded, setLoaded] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'error'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout | null = null;
    
    console.log("DashboardPage: Initializing...");
    
    // Set a short timeout for the auth check
    authTimeout = setTimeout(() => {
      if (isMounted && authStatus === 'checking') {
        console.error("DashboardPage: Authentication check timed out");
        toast.error("Authentication check timed out. Redirecting to login...");
        navigate("/login");
      }
    }, 2000); // 2 second timeout

    // Check if we have a session
    const checkAuth = async () => {
      try {
        console.log("DashboardPage: Checking session...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (authTimeout) clearTimeout(authTimeout);
        
        if (error) {
          console.error("DashboardPage: Error checking session:", error);
          toast.error("Authentication error. Redirecting to login...");
          if (isMounted) navigate("/login");
          return;
        }
        
        if (!data.session) {
          console.log("DashboardPage: No active session found");
          if (isMounted) navigate("/login");
          return;
        }
        
        console.log("DashboardPage: Valid session found");
        
        // We have a valid session
        if (isMounted) {
          setAuthStatus('authenticated');
          
          // Animation delay for the game UI feel
          setTimeout(() => {
            if (isMounted) {
              setLoaded(true);
            }
          }, 300);
        }
      } catch (error) {
        if (authTimeout) clearTimeout(authTimeout);
        console.error("DashboardPage: Error in auth check:", error);
        
        if (isMounted) {
          setAuthStatus('error');
          toast.error("Authentication error. Redirecting to login...");
          navigate("/login");
        }
      }
    };
    
    // Check auth immediately
    checkAuth();
    
    // Also listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("DashboardPage: Auth state changed:", event);
      
      if (event === 'SIGNED_OUT' && isMounted) {
        navigate("/login");
      }
    });
    
    // Cleanup function
    return () => {
      console.log("DashboardPage: Cleaning up...");
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Don't render dashboard until auth check is complete
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Verifying session...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="text-xl mb-4 text-red-500">Authentication Error</div>
        <div className="mb-6">There was a problem verifying your session.</div>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background with particles */}
      <ParticleBackground particleCount={80} opacity={0.6} />
      
      {/* Decorative glowing elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-matrix-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-matrix-primary/5 rounded-full blur-3xl"></div>
      
      {/* Main dashboard with game UI styling */}
      <div className={`transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
