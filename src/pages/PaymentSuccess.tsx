
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Verify user authentication
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          navigate("/login");
          return;
        }
        
        // Check if the user has an active subscription
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('status', 'active')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error checking subscription:", error);
        }
        
        // If user has subscription, redirect to dashboard after 5 seconds
        if (subscriptions) {
          setTimeout(() => {
            navigate("/dashboard");
          }, 5000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkPaymentStatus();
  }, [navigate]);

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
