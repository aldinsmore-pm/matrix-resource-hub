
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
        if (paymentStatus === 'success') {
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
