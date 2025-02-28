
import { useState } from "react";
import { Menu, ChevronLeft, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  animationComplete: boolean;
  subscription: { plan: string; status: string } | null;
  handleLogout: () => Promise<void>;
}

const DashboardHeader = ({
  sidebarOpen,
  toggleSidebar,
  animationComplete,
  subscription,
  handleLogout
}: DashboardHeaderProps) => {
  return (
    <header className={`bg-matrix-bg-alt/60 backdrop-blur-md border-b border-matrix-border p-4 transition-all duration-500 
      ${animationComplete ? 'opacity-100' : 'opacity-0 -translate-y-10'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {!sidebarOpen && (
            <button 
              onClick={toggleSidebar} 
              className="mr-3 hover:bg-matrix-muted p-1 rounded-md transition-all duration-300"
            >
              <Menu className="w-5 h-5 text-matrix-primary" />
            </button>
          )}
          <h2 className="text-xl font-bold text-white pipboy-text">Dashboard</h2>
        </div>
        <div className="text-sm text-gray-400 pipboy-text">
          <span className="bg-green-500 w-2 h-2 rounded-full inline-block mr-2"></span>
          <span className="mr-1">{subscription?.plan || "Free Plan"}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
