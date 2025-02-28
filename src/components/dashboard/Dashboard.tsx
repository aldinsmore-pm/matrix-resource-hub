
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book, FileText, BarChart, FileCode, Settings, LogOut } from "lucide-react";
import { supabase, getProfile, getSubscription } from "../../lib/supabase";
import ResourcesSection from "./ResourcesSection";
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

interface Resource {
  id: string;
  title: string;
  category: string;
  created_at: string;
  published: boolean;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        
        // Load recent resources from Supabase
        console.log("Loading recent resources...");
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
              <span className="mr-1">{subscription?.plan || "Free Plan"}</span>
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
                  value={recentResources.length.toString()} 
                  description="AI resources"
                  color="bg-matrix-primary"
                />
                <DashboardCard 
                  title="Documents" 
                  value="0" 
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
              
              {/* New split layout for resources and news links */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="card-container p-5 rounded-lg">
                  <ResourcesLinkList />
                </div>
                
                <div className="card-container p-5 rounded-lg">
                  <NewsLinkList />
                </div>
              </div>
              
              {/* Your content links */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Your Content</h4>
                <div className="card-container p-4 rounded-lg">
                  {recentResources.length > 0 ? (
                    <div className="divide-y divide-matrix-border">
                      {recentResources.map((resource) => (
                        <ResourceItem 
                          key={resource.id}
                          title={resource.title}
                          category={resource.category}
                          date={formatDate(resource.created_at)}
                          published={resource.published}
                          onClick={() => navigate(`/dashboard/resources/${resource.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p>No resources found. Create your first resource in the Resources section.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeSection === "resources" && <ResourcesSection />}
          
          {activeSection !== "overview" && activeSection !== "resources" && (
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

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Created today";
  } else if (diffDays === 1) {
    return "Created yesterday";
  } else {
    return `Created ${diffDays} days ago`;
  }
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
  date,
  published,
  onClick
}: { 
  title: string;
  category: string;
  date: string;
  published: boolean;
  onClick: () => void;
}) => {
  return (
    <div className="py-3">
      <div className="flex justify-between">
        <div>
          <h5 className="font-medium text-white">{title}</h5>
          <div className="flex items-center mt-1">
            <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded">{category}</span>
            <span className="text-xs text-gray-500 ml-2">{date}</span>
            {published ? (
              <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded ml-2">Published</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded ml-2">Draft</span>
            )}
          </div>
        </div>
        <button onClick={onClick} className="text-matrix-primary hover:underline text-sm">View</button>
      </div>
    </div>
  );
};

export default Dashboard;
