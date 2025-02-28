
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SubscriptionPage from "../components/subscription/SubscriptionPage";
import { supabase, isSubscribed } from "../lib/supabase";

const Subscription = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          // If not logged in, redirect to login
          navigate("/login");
          return;
        }
        
        // Handle Stripe payment success or cancel
        const paymentStatus = searchParams.get('payment_status');
        const sessionId = searchParams.get('session_id');
        
        if (paymentStatus === 'success' && sessionId) {
          setLoading(true);
          toast.info('Verifying your payment...');
          
          try {
            // Verify the session with our edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-session', {
              body: { 
                sessionId,
                userId: data.user.id
              },
            });
            
            if (verifyError) {
              throw new Error(verifyError.message || "Failed to verify payment");
            }
            
            if (verifyData.success) {
              toast.success('Your subscription was successful!');
              navigate("/dashboard");
              return;
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            toast.error('There was a problem verifying your payment. Please contact support.');
          }
        } else if (paymentStatus === 'success') {
          // Legacy success without session ID
          toast.success('Your subscription was successful!');
          navigate("/dashboard");
          return;
        } else if (paymentStatus === 'cancelled') {
          toast.error('Payment was cancelled. You can try again anytime.');
        }
        
        // Check if user already has an active subscription
        const hasSubscription = await isSubscribed();
        
        if (hasSubscription) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [navigate, searchParams]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      <div className="pt-24">
        <SubscriptionPage />
      </div>
      <Footer />
    </div>
  );
};

export default Subscription;
