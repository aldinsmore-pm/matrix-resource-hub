
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book, FileText, BarChart, FileCode, Settings, LogOut } from "lucide-react";
import { supabase, getProfile, getSubscription } from "../../lib/supabase";

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
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get user profile
        const userProfile = await getProfile();
        setProfile(userProfile);
        
        // Get subscription info
        const userSubscription = await getSubscription();
        setSubscription(userSubscription);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">User not found.</div>;
  }

  return (
    <div className="min-h-screen bg-matrix-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-matrix-bg-alt border-r border-matrix-border p-4 hidden md:block">
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
            onClick={() => setActiveSection("overview")}
          />
          <SidebarItem 
            icon={<Book className="w-5 h-5" />} 
            label="Resources" 
            active={activeSection === "resources"}
            onClick={() => setActiveSection("resources")}
          />
          <SidebarItem 
            icon={<FileText className="w-5 h-5" />} 
            label="Documents" 
            active={activeSection === "documents"}
            onClick={() => setActiveSection("documents")}
          />
          <SidebarItem 
            icon={<FileCode className="w-5 h-5" />} 
            label="AI Tools" 
            active={activeSection === "tools"}
            onClick={() => setActiveSection("tools")}
          />
          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            active={activeSection === "settings"}
            onClick={() => setActiveSection("settings")}
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
      <div className="flex-1 overflow-auto">
        <header className="bg-matrix-bg-alt border-b border-matrix-border p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <div className="text-sm text-gray-400">
              <span className="bg-green-500 w-2 h-2 rounded-full inline-block mr-2"></span>
              <span className="mr-1">{subscription?.plan || "Subscribed"}</span>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">
                Welcome, {profile.first_name || profile.email.split('@')[0]}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardCard 
                  title="Resources Available" 
                  value="24" 
                  description="Premium AI resources"
                  color="bg-matrix-primary"
                />
                <DashboardCard 
                  title="Documents" 
                  value="12" 
                  description="Saved documents"
                  color="bg-matrix-secondary"
                />
                <DashboardCard 
                  title="AI Tools" 
                  value="8" 
                  description="Available tools"
                  color="bg-matrix-accent"
                />
              </div>
              
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Recent Resources</h4>
                <div className="card-container p-4 rounded-lg">
                  <div className="divide-y divide-matrix-border">
                    <ResourceItem 
                      title="AI Implementation Framework" 
                      category="Framework"
                      date="Accessed 2 days ago"
                    />
                    <ResourceItem 
                      title="Machine Learning ROI Calculator" 
                      category="Tool"
                      date="Accessed 3 days ago"
                    />
                    <ResourceItem 
                      title="LLM Integration Toolkit" 
                      category="Toolkit"
                      date="Accessed 5 days ago"
                    />
                  </div>
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

const DashboardCard = ({ 
  title, 
  value, 
  description, 
  color 
}: { 
  title: string;
  value: string;
  description: string;
  color: string;
}) => {
  return (
    <div className="card-container p-5 rounded-lg">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
        <span className="text-black font-bold">{value}</span>
      </div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
};

const ResourceItem = ({ 
  title, 
  category, 
  date 
}: { 
  title: string;
  category: string;
  date: string;
}) => {
  return (
    <div className="py-3">
      <div className="flex justify-between">
        <div>
          <h5 className="font-medium text-white">{title}</h5>
          <div className="flex items-center mt-1">
            <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded">{category}</span>
            <span className="text-xs text-gray-500 ml-2">{date}</span>
          </div>
        </div>
        <button className="text-matrix-primary hover:underline text-sm">View</button>
      </div>
    </div>
  );
};

export default Dashboard;
