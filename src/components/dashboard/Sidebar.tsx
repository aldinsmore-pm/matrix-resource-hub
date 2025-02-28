
import { ChevronLeft, BarChart, Book, FileText, FileCode, Settings, LogOut, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleLogout: () => Promise<void>;
  animationComplete: boolean;
}

const Sidebar = ({
  sidebarOpen,
  toggleSidebar,
  activeSection,
  setActiveSection,
  handleLogout,
  animationComplete
}: SidebarProps) => {
  return (
    <div 
      className={`bg-matrix-bg-alt/70 backdrop-blur-md border-r border-matrix-border p-4 transition-all duration-500 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } fixed h-full z-10 ${
        animationComplete ? 'opacity-100' : 'opacity-0 -translate-x-10'
      }`} 
      style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)' }}
    >
      <div className="flex items-center justify-between mb-8">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold text-matrix-primary animate-pulse">
            <span className="text-white pipboy-text">Aire</span>
          </h1>
        ) : (
          <span className="text-xl font-bold text-matrix-primary animate-pulse">Aire</span>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-md hover:bg-matrix-muted text-matrix-primary transition-all duration-300"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarOpen ? '' : 'transform rotate-180'}`} />
        </button>
      </div>
      
      <nav className="space-y-1">
        <SidebarItem 
          icon={<BarChart className="w-5 h-5" />} 
          label="Overview" 
          active={activeSection === "overview"} 
          onClick={() => setActiveSection("overview")} 
          collapsed={!sidebarOpen} 
        />
        <SidebarItem 
          icon={<Book className="w-5 h-5" />} 
          label="Resources" 
          active={activeSection === "resources"} 
          onClick={() => setActiveSection("resources")} 
          collapsed={!sidebarOpen} 
        />
        <SidebarItem 
          icon={<FileText className="w-5 h-5" />} 
          label="Documents" 
          active={activeSection === "documents"} 
          onClick={() => setActiveSection("documents")} 
          collapsed={!sidebarOpen} 
        />
        <SidebarItem 
          icon={<FileCode className="w-5 h-5" />} 
          label="AI Tools" 
          active={activeSection === "tools"} 
          onClick={() => setActiveSection("tools")} 
          collapsed={!sidebarOpen} 
        />
        <SidebarItem 
          icon={<Link className="w-5 h-5" />} 
          label="Links" 
          active={activeSection === "links"} 
          onClick={() => setActiveSection("links")} 
          collapsed={!sidebarOpen} 
        />
        <SidebarItem 
          icon={<Settings className="w-5 h-5" />} 
          label="Settings" 
          active={activeSection === "settings"} 
          onClick={() => setActiveSection("settings")} 
          collapsed={!sidebarOpen} 
        />
        
        <div className="pt-6 mt-6 border-t border-matrix-border">
          <button 
            onClick={handleLogout} 
            className={`flex items-center px-3 py-2 w-full text-gray-400 hover:text-white hover:bg-matrix-muted rounded transition-colors ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && <span className="pipboy-text">Log Out</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const SidebarItem = ({ icon, label, active, onClick, collapsed }: SidebarItemProps) => {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 w-full rounded transition-all duration-300 ${
        active ? "bg-matrix-primary/20 text-matrix-primary" : "text-gray-400 hover:text-white hover:bg-matrix-muted"
      }`} 
      title={collapsed ? label : undefined}
    >
      <span className={collapsed ? '' : 'mr-3'}>{icon}</span>
      {!collapsed && <span className="pipboy-text">{label}</span>}
      {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-matrix-primary"></span>}
    </button>
  );
};

export default Sidebar;
