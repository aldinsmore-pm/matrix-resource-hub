import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import ResourcesSection from "./ResourcesSection";
import LinksSection from "./LinksSection";
import UnderDevelopmentSection from "./UnderDevelopmentSection";
import { useAuth } from "../../contexts/AuthContext";

interface LocationState {
  section?: string;
  view?: string;
  resourceId?: string;
}

const Dashboard = () => {
  const { profile, subscription, user, hasSubscription, refreshSubscription } = useAuth();
  const [recentResources, setRecentResources] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state) {
      console.log("Location state:", state);
      if (state.section) {
        setActiveSection(state.section);
      }
      if (state.resourceId) {
        setResourceId(state.resourceId);
      }
      if (state.view) {
        setViewMode(state.view);
      }
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        console.log("Loading dashboard data for user:", user?.id);

        if (!user) {
          throw new Error("No authenticated user found");
        }

        // Refresh subscription to ensure we have the latest data
        await refreshSubscription();

        // Load recent resources from Supabase
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, title, category, created_at, published')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (resourcesError) {
          console.error("Error loading resources:", resourcesError);
          throw resourcesError;
        }
        
        setRecentResources(resourcesData || []);
        console.log("Data loading complete");
      } catch (error: any) {
        console.error("Error loading user data:", error);
        setLoadError(error.message || "Failed to load user data");
        toast.error("Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadUserData();
    }
  }, [user, refreshSubscription]);
  
  const handleLogout = async () => {
    try {
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4 text-matrix-primary text-xl">Initializing...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="text-xl mb-4 text-red-500">Error loading dashboard</div>
        <div className="mb-4">{loadError}</div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-all duration-300"
        >
          Return to Login
        </button>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="text-xl mb-4">User not found.</div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-all duration-300"
        >
          Return to Login
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-matrix-bg flex">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        animationComplete={animationComplete}
      />
      
      <div className={`flex-1 transition-all duration-300 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <DashboardHeader 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          animationComplete={animationComplete}
          subscription={subscription}
          handleLogout={handleLogout}
        />
        
        <main className="p-6">
          {activeSection === "overview" && (
            <DashboardOverview 
              profile={profile}
              recentResources={recentResources}
              animationComplete={animationComplete}
              setActiveSection={setActiveSection}
            />
          )}
          
          {activeSection === "resources" && (
            <div className={`transition-all duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-5'}`}>
              <ResourcesSection initialResourceId={resourceId} initialView={viewMode} />
            </div>
          )}
            
          {activeSection === "links" && (
            <div className={`transition-all duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-5'}`}>
              <LinksSection />
            </div>
          )}
          
          {activeSection !== "overview" && activeSection !== "resources" && activeSection !== "links" && (
            <UnderDevelopmentSection 
              sectionName={activeSection} 
              animationComplete={animationComplete}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
