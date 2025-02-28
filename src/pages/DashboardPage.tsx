
import { useEffect, useState } from "react";
import Dashboard from "../components/dashboard/Dashboard";
import ParticleBackground from "../components/ParticleBackground";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = () => {
  const [loaded, setLoaded] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Simple animation delay for the UI
    if (isAuthenticated && !isLoading) {
      const timer = setTimeout(() => {
        setLoaded(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Loading dashboard...</div>
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
