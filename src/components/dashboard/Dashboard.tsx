
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book, FileText, BarChart, FileCode, Settings, LogOut, Menu, X } from "lucide-react";
import { supabase, getProfile, getSubscription } from "../../lib/supabase";
import ResourcesLinkList from "./ResourcesLinkList";
import NewsLinkList from "./NewsLinkList";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserData() {
      try {
        console.log("Checking authentication status...");
        const { data: authData } = await supabase.auth.getUser();
        
        if (!authData.user) {
          console.log("No authenticated user found, redirecting to login");
          navigate("/login");
          return;
        }
        
        console.log("User authenticated, loading profile data...");
        // Get user profile
        const userProfile = await getProfile();
        if (!userProfile) {
          throw new Error("Failed to load user profile");
        }
        setProfile(userProfile);
        
        console.log("Loading subscription data...");
        // Get subscription info
        const userSubscription = await getSubscription();
        setSubscription(userSubscription);
      } catch (error: any) {
        console.error("Error loading user data:", error);
        setLoadError(error.message || "Failed to load user data");
        toast.error("Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Loading dashboard data...</div>
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
          className="px-4 py-2 bg-matrix-primary text-black rounded"
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
          className="px-4 py-2 bg-matrix-primary text-black rounded"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matrix-bg flex flex-col md:flex-row">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button 
          onClick={toggleSidebar}
          className="p-2 bg-matrix-bg-alt rounded-md border border-matrix-border"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-matrix-primary" /> : <Menu className="w-6 h-6 text-matrix-primary" />}
        </button>
      </div>
      
      {/* Sidebar - collapsible on mobile */}
      <div 
        className={`fixed md:relative w-64 md:w-64 bg-matrix-bg-alt border-r border-matrix-border p-4 h-full z-20 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-xl font-bold text-matrix-primary">
            AI <span className="text-white">Unlocked</span>
          </h1>
        </div>
        
        <nav className="space-y-1">
          <SidebarItem 
            icon={<BarChart className="w-5 h-5" />} 
            label="Overview" 
            active={activeSection === "overview"}
            onClick={() => {
              setActiveSection("overview");
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
          />
          <SidebarItem 
            icon={<Book className="w-5 h-5" />} 
            label="Resources" 
            active={activeSection === "resources"}
            onClick={() => {
              setActiveSection("resources");
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
          />
          <SidebarItem 
            icon={<FileText className="w-5 h-5" />} 
            label="Documents" 
            active={activeSection === "documents"}
            onClick={() => {
              setActiveSection("documents");
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
          />
          <SidebarItem 
            icon={<FileCode className="w-5 h-5" />} 
            label="AI Tools" 
            active={activeSection === "tools"}
            onClick={() => {
              setActiveSection("tools");
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
          />
          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            active={activeSection === "settings"}
            onClick={() => {
              setActiveSection("settings");
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
          />
          
          <div className="pt-6 mt-6 border-t border-matrix-border">
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 w-full text-gray-400 hover:text-white hover:bg-matrix-muted rounded transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-0 overflow-auto">
        <header className="bg-matrix-bg-alt border-b border-matrix-border p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white ml-12 md:ml-0">Dashboard</h2>
            <div className="text-sm text-gray-400">
              <span className="bg-green-500 w-2 h-2 rounded-full inline-block mr-2"></span>
              <span className="mr-1">{subscription?.plan || "Free Plan"}</span>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">
                Welcome, {profile.first_name || profile.email.split('@')[0]}
              </h3>
              
              {/* Two-column layout with resources (left) and news (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-container p-5 rounded-lg">
                  <ResourcesLinkList />
                </div>
                
                <div className="card-container p-5 rounded-lg">
                  <NewsLinkList />
                </div>
              </div>
            </div>
          )}
          
          {activeSection !== "overview" && (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
                <p className="text-gray-400">This section is under development.</p>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

const SidebarItem = ({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-2 w-full rounded transition-colors ${
        active 
          ? "bg-matrix-primary bg-opacity-10 text-matrix-primary" 
          : "text-gray-400 hover:text-white hover:bg-matrix-muted"
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default Dashboard;
