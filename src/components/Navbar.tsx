
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSubscribed } from "../lib/supabase";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Check authentication status
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          setIsLoggedIn(true);
          setUserEmail(data.user.email);
          
          // Check subscription status
          const subscribed = await isSubscribed();
          setHasSubscription(subscribed);
        } else {
          setIsLoggedIn(false);
          setHasSubscription(false);
          setUserEmail(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    }
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoggedIn(!!session);
        setUserEmail(session?.user?.email || null);
        
        if (session?.user) {
          const subscribed = await isSubscribed();
          setHasSubscription(subscribed);
        } else {
          setHasSubscription(false);
        }
      }
    );
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "py-3 bg-matrix-bg shadow-lg bg-opacity-80 backdrop-blur-lg" : "py-6"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="text-xl md:text-2xl font-bold text-matrix-primary text-glow">
              AI <span className="text-white">Unlocked</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="#resources">Resources</NavLink>
            <NavLink href="#news">News</NavLink>
            <NavLink href="#guides">Guides</NavLink>
            
            <div className="relative group">
              <button className="flex items-center text-gray-300 hover:text-white transition-colors">
                <span>Solutions</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-matrix-bg-alt border border-matrix-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 z-50">
                <div className="py-1 card-container rounded-md">
                  <DropdownLink href="#">Enterprise AI</DropdownLink>
                  <DropdownLink href="#">AI Integration</DropdownLink>
                  <DropdownLink href="#">AI Training</DropdownLink>
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                {userEmail && (
                  <span className="text-gray-400 text-sm hidden lg:inline-block">
                    {userEmail}
                  </span>
                )}
                <a 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </a>
                <button 
                  onClick={handleLogout}
                  className="text-matrix-primary hover:text-matrix-primary hover:underline transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a 
                  href="/login" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Log In
                </a>
                <a href="/signup" className="matrix-btn">
                  Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-matrix-bg-alt border-t border-matrix-border absolute w-full left-0 transition-all duration-300 ease-in-out shadow-lg ${
          isMobileMenuOpen ? "top-full opacity-100 visible" : "-top-96 opacity-0 invisible"
        }`}
      >
        <div className="container mx-auto py-4 px-4 space-y-3">
          <MobileNavLink href="#resources">Resources</MobileNavLink>
          <MobileNavLink href="#news">News</MobileNavLink>
          <MobileNavLink href="#guides">Guides</MobileNavLink>
          
          <div className="border-t border-matrix-border pt-3">
            <MobileNavLink href="#enterprise-ai">Enterprise AI</MobileNavLink>
            <MobileNavLink href="#ai-integration">AI Integration</MobileNavLink>
            <MobileNavLink href="#ai-training">AI Training</MobileNavLink>
          </div>
          
          <div className="pt-3 border-t border-matrix-border">
            {isLoggedIn ? (
              <>
                {userEmail && (
                  <div className="py-2 text-gray-400 text-sm">
                    {userEmail}
                  </div>
                )}
                <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
                <button 
                  onClick={handleLogout}
                  className="block py-2 text-matrix-primary hover:underline w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobileNavLink href="/login">Log In</MobileNavLink>
                <div className="pt-3">
                  <a
                    href="/signup"
                    className="block w-full text-center matrix-btn py-3"
                  >
                    Sign Up
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Desktop Navigation Link
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      className="relative group text-gray-300 hover:text-white transition-colors"
    >
      {children}
      <div className="focus-line"></div>
    </a>
  );
};

// Dropdown Link
const DropdownLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      className="block px-4 py-2 text-sm text-gray-300 hover:text-matrix-primary hover:bg-matrix-muted transition-colors"
    >
      {children}
    </a>
  );
};

// Mobile Navigation Link
const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      className="block py-2 text-gray-300 hover:text-matrix-primary transition-colors"
    >
      {children}
    </a>
  );
};

export default Navbar;
