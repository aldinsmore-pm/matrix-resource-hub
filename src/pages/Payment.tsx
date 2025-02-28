
import { useState } from "react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

const Payment = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle one-time purchase via Stripe
  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Preparing checkout...");
      
      // Get the current URL for the return URL
      const returnUrl = window.location.origin + "/payment-success";
      
      // Check if user is logged in
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error("You must be logged in to make a purchase");
        setIsLoading(false);
        return;
      }
      
      console.log("Calling create-checkout function with:", {
        returnUrl
      });
      
      // Use the Supabase client to call the Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          returnUrl
        }
      });
      
      if (error) {
        console.error("Checkout function error:", error);
        toast.error(`Failed to create checkout session: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Checkout response data:", data);
      
      if (!data || !data.url) {
        toast.error("Failed to create checkout session: No URL returned");
        console.error("Invalid response from checkout function:", data);
        setIsLoading(false);
        return;
      }
      
      // Redirect to Stripe Checkout
      console.log("Redirecting to Stripe checkout:", data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to process payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Get <span className="text-matrix-primary">Full Access</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              One-time payment for permanent access to all features
            </p>
          </div>
          
          <div className="max-w-xl mx-auto">
            <div className="bg-matrix-muted p-8 rounded-lg border border-matrix-border">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-matrix-primary mb-2">$99</div>
                <p className="text-gray-300">One-time payment for lifetime access</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="text-matrix-primary mr-2">•</div>
                  <span className="text-gray-300">Complete access to all AI implementation resources</span>
                </li>
                <li className="flex items-start">
                  <div className="text-matrix-primary mr-2">•</div>
                  <span className="text-gray-300">Exclusive industry reports and analysis</span>
                </li>
                <li className="flex items-start">
                  <div className="text-matrix-primary mr-2">•</div>
                  <span className="text-gray-300">Priority support from our AI specialists</span>
                </li>
                <li className="flex items-start">
                  <div className="text-matrix-primary mr-2">•</div>
                  <span className="text-gray-300">Regular updates on emerging AI technologies</span>
                </li>
                <li className="flex items-start">
                  <div className="text-matrix-primary mr-2">•</div>
                  <span className="text-gray-300">No recurring payments or subscription fees</span>
                </li>
              </ul>
              
              <button 
                onClick={handlePayment}
                disabled={isLoading}
                className={`w-full py-3 rounded-md font-medium transition-all bg-matrix-primary text-black hover:bg-opacity-90 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Processing..." : "Purchase Now"}
              </button>
              
              <p className="text-sm text-gray-400 mt-4 text-center">
                Secure payment processing through Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
