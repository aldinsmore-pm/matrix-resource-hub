import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // When component mounts, set a flag in localStorage to indicate recent payment
    // This flag will let the user access the dashboard even if the subscription record
    // hasn't been created in the database yet by the webhook
    localStorage.setItem('recent_payment', 'true');
    
    // Set the flag to expire after 1 hour (in milliseconds)
    localStorage.setItem('recent_payment_timestamp', Date.now().toString());

    // Declare a flag to prevent multiple state updates after component unmounts
    let isMounted = true;

    const checkPaymentStatus = async () => {
      if (processingComplete) return; // Prevent extra checks if already complete

      try {
        console.log("Starting payment check...");
        
        // Get the current session - this is crucial for RLS policies
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast.error("Authentication session error. Please log in again.");
          if (isMounted) {
            setProcessingComplete(true);
            navigate("/login");
          }
          return;
        }
        
        if (!sessionData.session) {
          console.log("No active session found, redirecting to login");
          toast.error("Your session has expired. Please log in again.");
          if (isMounted) {
            setProcessingComplete(true);
            navigate("/login");
          }
          return;
        }
        
        // Verify user authentication with the session
        const { data: userData, error: authError } = await supabase.auth.getUser(sessionData.session.access_token);
        
        if (authError) {
          console.error("Authentication error:", authError);
          toast.error("Authentication error. Please log in again.");
          if (isMounted) {
            setProcessingComplete(true);
            navigate("/login");
          }
          return;
        }
        
        if (!userData.user) {
          console.log("No user found, redirecting to login");
          toast.error("You need to be logged in to complete this process.");
          if (isMounted) {
            setProcessingComplete(true);
            navigate("/login");
          }
          return;
        }
        
        console.log("Checking subscription status for user:", userData.user.id);
        
        // Check if the user has an active subscription
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('status', 'active');
        
        if (subError) {
          console.error("Error checking subscription:", subError);
          // Only consider this a fatal error if it's not just "not found"
          if (subError.code !== 'PGRST116') { 
            toast.error("Failed to verify your purchase status. Please contact support.");
            if (isMounted) setProcessingComplete(true);
          }
        }
        
        // If user has subscription, redirect to dashboard
        if (subscriptions && subscriptions.length > 0) {
          console.log("Active subscription found:", subscriptions[0].id);
          toast.success("Your purchase has been confirmed!");
          
          if (isMounted) {
            setProcessingComplete(true);
            // Delay navigation to allow toast to be seen
            setTimeout(() => {
              navigate("/dashboard");
            }, 3000);
          }
        } else {
          // If we don't find a subscription yet, it might still be processing
          console.log(`Attempt ${retryCount + 1}: No active subscription found yet, retrying...`);
          
          if (retryCount === 0 && isMounted) {
            toast.info("Your purchase is being processed. This may take a moment...");
          }
          
          // Only retry up to 5 times (15 seconds total)
          if (retryCount < 5 && !processingComplete && isMounted) {
            setRetryCount(prev => prev + 1);
            // Use setTimeout to delay next check
            setTimeout(() => {
              if (isMounted && !processingComplete) {
                checkPaymentStatus();
              }
            }, 3000);
          } else if (!processingComplete && isMounted) {
            console.log("Maximum retries reached, redirecting to dashboard anyway");
            toast.info("Payment process complete. Redirecting to dashboard...");
            
            if (isMounted) {
              setProcessingComplete(true);
              setTimeout(() => {
                navigate("/dashboard");
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast.error("An error occurred while verifying your payment.");
        if (isMounted) setProcessingComplete(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // Only start the process if not already completed
    if (!processingComplete) {
      checkPaymentStatus();
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [navigate, retryCount, processingComplete]);

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-matrix-muted p-8 rounded-lg border border-matrix-border text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-white">Payment Successful!</h1>
            
            <p className="text-gray-300 text-lg mb-6">
              Thank you for your purchase. You now have full access to Aire.
            </p>
            
            <p className="text-gray-400 mb-8">
              You will be automatically redirected to the dashboard in a few seconds...
            </p>
            
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-matrix-primary text-black font-semibold rounded-md hover:bg-opacity-90 transition-all"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
