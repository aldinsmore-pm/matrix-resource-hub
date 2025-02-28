
import { useEffect, useState } from "react";
import Dashboard from "../components/dashboard/Dashboard";
import ParticleBackground from "../components/ParticleBackground";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DashboardPage = () => {
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // Check authentication status to handle any issues
    async function checkAuth() {
      try {
        setAuthChecking(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          toast.error("Authentication error. Redirecting to login...");
          navigate("/login");
          return;
        }
        
        if (!data.session) {
          console.log("No active session found. Redirecting to login...");
          navigate("/login");
          return;
        }
        
        // Session is valid
        setAuthChecking(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        toast.error("Authentication error. Redirecting to login...");
        navigate("/login");
      }
    }
    
    checkAuth();
    
    // Animation delay for the game UI feel - only if auth passes
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Don't render dashboard until auth check is complete
  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Verifying session...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
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
