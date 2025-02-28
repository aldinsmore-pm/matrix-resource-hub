
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResourcesLinkList from "./ResourcesLinkList";
import NewsLinkList from "./NewsLinkList";
import LinksLinkList from "./LinksLinkList";
import { Book, Link as LinkIcon, Settings } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  category: string;
  created_at: string;
  published: boolean;
}

interface DashboardOverviewProps {
  profile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  recentResources: Resource[];
  animationComplete: boolean;
  setActiveSection: (section: string) => void;
}

const DashboardOverview = ({
  profile,
  recentResources,
  animationComplete,
  setActiveSection
}: DashboardOverviewProps) => {
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      <h3 className={`text-xl font-bold mb-4 transition-all duration-700 delay-100 pipboy-text
        ${animationComplete ? 'opacity-100' : 'opacity-0 -translate-y-5'}`}>
        Welcome, {profile?.first_name || profile?.email.split('@')[0]}
      </h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className={`card-container p-5 rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30 
          transition-all duration-700 delay-300 transform hover:scale-[1.01] hover:border-matrix-primary/50
          ${animationComplete ? 'opacity-100' : 'opacity-0 -translate-x-5'}`} 
          style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
        >
          <ResourcesLinkList />
        </div>
        
        <div className={`card-container p-5 rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30 
          transition-all duration-700 delay-400 transform hover:scale-[1.01] hover:border-matrix-primary/50
          ${animationComplete ? 'opacity-100' : 'opacity-0 translate-x-5'}`} 
          style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
        >
          <NewsLinkList />
        </div>
      </div>
      
      <div className={`transition-all duration-700 delay-450 ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-5'}`}>
        <div 
          className="card-container p-5 rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30 transform hover:scale-[1.01] hover:border-matrix-primary/50" 
          style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
        >
          <LinksLinkList />
        </div>
      </div>
      
      <div className={`mt-8 transition-all duration-700 delay-500 ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-5'}`}>
        <h4 className="text-lg font-semibold mb-4 pipboy-text">Your Content</h4>
        <div className="grid grid-cols-2 gap-6">
          <div 
            className="card-container p-4 rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30" 
            style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
          >
            <h5 className="text-base font-medium mb-3 pipboy-text">Recent Resources</h5>
            {recentResources.length > 0 ? (
              <div className="divide-y divide-matrix-border">
                {recentResources.slice(0, 3).map((resource, index) => (
                  <ResourceItem 
                    key={resource.id} 
                    title={resource.title} 
                    category={resource.category} 
                    date={formatDate(resource.created_at)} 
                    published={resource.published} 
                    onClick={() => {
                      navigate('/dashboard', { 
                        state: { 
                          section: 'resources',
                          view: 'detail',
                          resourceId: resource.id 
                        } 
                      });
                    }} 
                    delay={index * 100} 
                    animationComplete={animationComplete} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 pipboy-text">
                <p>No resources found.</p>
              </div>
            )}
          </div>
          
          <div 
            className="card-container p-4 rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30" 
            style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
          >
            <h5 className="text-base font-medium mb-3 pipboy-text">Quick Actions</h5>
            <div className="space-y-3">
              <QuickActionButton 
                icon={<Book className="w-4 h-4 mr-2" />} 
                label="Create New Resource" 
                onClick={() => setActiveSection("resources")} 
              />
              <QuickActionButton 
                icon={<LinkIcon className="w-4 h-4 mr-2" />} 
                label="Manage Links" 
                onClick={() => setActiveSection("links")} 
              />
              <QuickActionButton 
                icon={<Settings className="w-4 h-4 mr-2" />} 
                label="Account Settings" 
                onClick={() => setActiveSection("settings")} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResourceItemProps {
  title: string;
  category: string;
  date: string;
  published: boolean;
  onClick: () => void;
  delay?: number;
  animationComplete: boolean;
}

const ResourceItem = ({
  title,
  category,
  date,
  published,
  onClick,
  delay = 0,
  animationComplete
}: ResourceItemProps) => {
  return (
    <div 
      onClick={onClick}
      className={`py-3 transition-all duration-700 hover:bg-matrix-muted/20 px-2 rounded-md cursor-pointer
        ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-3'}`} 
      style={{ transitionDelay: `${delay + 500}ms` }}
    >
      <div className="flex justify-between">
        <div>
          <h5 className="font-medium text-white pipboy-text">{title}</h5>
          <div className="flex items-center mt-1">
            <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded pipboy-text">{category}</span>
            <span className="text-xs text-gray-500 ml-2 pipboy-text">{date}</span>
            {published ? (
              <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded ml-2 pipboy-text">Published</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded ml-2 pipboy-text">Draft</span>
            )}
          </div>
        </div>
        <button className="text-matrix-primary hover:underline text-sm transition-all duration-300 hover:text-matrix-primary/80 pipboy-text">
          View
        </button>
      </div>
    </div>
  );
};

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const QuickActionButton = ({ icon, label, onClick }: QuickActionButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center p-3 rounded-md border border-matrix-border/50 bg-matrix-bg-alt/30 transition-all duration-300 
        hover:bg-matrix-primary/10 hover:border-matrix-primary/40 text-left group"
    >
      <span className="text-matrix-primary">{icon}</span>
      <span className="pipboy-text text-gray-300 group-hover:text-white">{label}</span>
    </button>
  );
};

export default DashboardOverview;
