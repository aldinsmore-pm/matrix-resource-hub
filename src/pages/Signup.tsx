
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SignupForm from "../components/auth/SignupForm";
import { supabase, isSubscribed } from "../lib/supabase";
import ParticleBackground from "../components/ParticleBackground";

const Signup = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is already authenticated
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking auth:", error);
          setLoading(false);
          return;
        }
        
        if (data.user) {
          console.log("User is already authenticated, checking subscription...");
          // Check if user has an active subscription
          const hasSubscription = await isSubscribed();
          
          if (hasSubscription) {
            console.log("User has active subscription, redirecting to dashboard");
            navigate("/dashboard");
          } else {
            console.log("User does not have active subscription, redirecting to payment");
            navigate("/payment");
          }
        } else {
          console.log("No authenticated user found, showing signup page");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setLoading(false);
      }
    }
    
    const timeout = setTimeout(() => {
      // If auth check takes too long, stop loading state
      if (loading) {
        console.log("Auth check timeout reached, showing signup page");
        setLoading(false);
      }
    }, 3000); // 3 second timeout as fallback
    
    checkAuth();
    
    return () => clearTimeout(timeout);
  }, [navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
      <ParticleBackground opacity={0.5} />
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
