
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginForm from "../components/auth/LoginForm";
import { supabase, getSubscription, isSubscribed, createSubscription } from "../lib/supabase";
import { toast } from "sonner";
import ParticleBackground from "../components/ParticleBackground";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
            // If user came from a specific page, redirect back there
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from);
          } else {
            console.log("User does not have active subscription, redirecting to payment");
            navigate("/payment");
          }
        } else {
          console.log("No authenticated user found, showing login page");
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
        console.log("Auth check timeout reached, showing login page");
        setLoading(false);
      }
    }, 3000); // 3 second timeout as fallback
    
    checkAuth();
    
    return () => clearTimeout(timeout);
  }, [navigate, location.state, loading]);

  const handleTestLogin = async () => {
    setTestLoading(true);
    
    try {
      // Test account details - using your email
      const testEmail = "aldinsmore.me@gmail.com";
      const testPassword = "testpassword123";
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      // If sign-in was successful
      if (signInData.user) {
        toast.success("Logged in as Test User");
        
        // Check if user has an active subscription
        const hasSubscription = await isSubscribed();
        
        if (!hasSubscription) {
          // Create a subscription for the user if one doesn't exist
          await createSubscription("Professional", 365); // 1 year subscription
          toast.success("Added subscription to your account");
        }
        
        navigate("/dashboard");
        return;
      }
      
      // If login failed, we need to handle the case where account may exist
      // but with different credentials. Let's try to create an account.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: "Test",
            last_name: "User"
          }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          // The account exists but password is different
          // For a real app, this would be a security concern
          // For dev purposes, we'll inform the user
          toast.error("Account exists but password is different. Check console for details.");
          console.log("For development: The account exists but the password is different from what's being attempted.");
          console.log("You may need to use the Supabase dashboard to reset or manage this account.");
          return;
        }
        throw signUpError;
      }
      
      toast.success("Account created! Check your email to confirm registration");
      toast.info("Note: For development, you might want to disable email confirmation in Supabase");
      
    } catch (error: any) {
      console.error("Test login error:", error);
      toast.error(error.message || "Failed to create test account. Please try again.");
    } finally {
      setTestLoading(false);
    }
  };

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
          <LoginForm />
          
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-matrix-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-matrix-bg text-gray-400">Development Options</span>
              </div>
            </div>
            
            <button
              onClick={handleTestLogin}
              disabled={testLoading}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-matrix-primary rounded-md shadow-sm text-sm font-medium text-matrix-primary hover:bg-matrix-primary hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-matrix-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? "Setting up test account..." : "Quick Login (Test Account)"}
            </button>
            
            <p className="mt-2 text-xs text-gray-500">
              This creates a aldinsmore.me@gmail.com account with an active subscription
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
