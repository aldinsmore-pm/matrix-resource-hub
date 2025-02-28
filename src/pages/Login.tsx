import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { createSubscription, supabase, isSubscribed } from "../lib/supabase";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkAndSetSession = async () => {
      try {
        console.log("Login: Checking session");
        // First, ensure we're still mounted before proceeding with any redirects
        let mounted = true;
        
        // Get session - this will check both localStorage and perform a server check
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Login: Error checking session:", sessionError);
          setLoading(false);
          return;
        }
        
        if (sessionData?.session) {
          console.log("Login: Valid session found, checking subscription...");
          // Check if user has an active subscription
          const hasSubscription = await isSubscribed();
          
          if (hasSubscription && mounted) {
            console.log("Login: User has subscription, navigating to dashboard");
            navigate("/dashboard");
          } else if (mounted) {
            console.log("Login: User needs subscription, navigating to subscription page");
            navigate("/subscription");
          }
        } else {
          console.log("Login: No valid session found");
          setLoading(false);
        }
      } catch (error) {
        console.error("Login: Error checking auth:", error);
        setLoading(false);
      }
    };
    
    // Check auth immediately
    checkAndSetSession();
    
    // Also listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Login: Auth state changed:", event);
        if (session) {
          const hasSubscription = await isSubscribed();
          if (hasSubscription) {
            navigate("/dashboard");
          } else {
            navigate("/subscription");
          }
        }
      }
    );
    
    // Clean up listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleTestLogin = async () => {
    setTestLoading(true);
    
    try {
      // Test account details - using your email
      const testEmail = "aldinsmore.me@gmail.com";
      const testPassword = "testpassword123";
      
      console.log("Attempting test login with:", testEmail);
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      // If sign-in was successful
      if (signInData?.user) {
        toast.success("Logged in as Test User");
        console.log("Login successful for test account");
        
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
      
      // If we reach here, sign-in failed
      if (signInError) {
        console.log("Test login error:", signInError);
        
        // If login failed, we need to create an account
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
            toast.error("Account exists but password is different. Check console for details.");
            console.log("For development: The account exists but the password is different from what's being attempted.");
            console.log("You may need to use the Supabase dashboard to reset or manage this account.");
            return;
          }
          throw signUpError;
        }
        
        toast.success("Account created! Check your email to confirm registration");
        toast.info("Note: For development, you might want to disable email confirmation in Supabase");
      }
      
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
        <div className="flex flex-col items-center">
          <div className="mb-4">Checking session...</div>
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
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
