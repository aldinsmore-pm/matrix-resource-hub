
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SignupForm from "../components/auth/SignupForm";
import { supabase, isSubscribed } from "../lib/supabase";

const Signup = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is already authenticated
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          // Check if user has an active subscription
          const hasSubscription = await isSubscribed();
          
          if (hasSubscription) {
            navigate("/dashboard");
          } else {
            navigate("/subscription");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [navigate]);

  // Listen for hash fragment in URL that could contain auth tokens
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Check if there's a hash fragment with tokens
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token") || hash.includes("error"))) {
          // Process the hash fragment to set the session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Auth redirect error:", error);
            throw error;
          }
          
          if (data.session) {
            // User is authenticated, check subscription
            const hasSubscription = await isSubscribed();
            
            if (hasSubscription) {
              navigate("/dashboard");
            } else {
              navigate("/subscription");
            }
          }
        }
      } catch (error) {
        console.error("Error handling auth redirect:", error);
      }
    };
    
    handleAuthRedirect();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <SignupForm />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Signup;
