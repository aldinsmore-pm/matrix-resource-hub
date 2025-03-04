import { useState, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

// Add type declaration for Stripe
declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}

const Payment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stripeJs, setStripeJs] = useState<any>(null);
  
  // Load Stripe.js on component mount
  useEffect(() => {
    const loadStripe = () => {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        console.error("Stripe publishable key is not set");
        return;
      }
      
      try {
        const stripeInstance = window.Stripe(publishableKey);
        setStripeJs(stripeInstance);
        console.log("Stripe initialized successfully");
      } catch (error) {
        console.error("Error initializing Stripe:", error);
      }
    };
    
    // Wait a short moment to ensure Stripe.js is loaded
    setTimeout(loadStripe, 100);
  }, []);

  // Function to handle direct checkout with Stripe
  const handleDirectCheckout = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Preparing Stripe checkout...");
      
      // Check if Stripe is loaded
      if (!stripeJs) {
        toast.error("Stripe.js is still loading. Please try again in a moment.");
        console.error("Stripe.js not initialized when attempting checkout");
        setIsLoading(false);
        return;
      }
      
      // Get the current URL for the return URL
      const returnUrl = window.location.origin + "/payment-success";
      
      // Check if user is logged in
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error("You must be logged in to make a purchase");
        setIsLoading(false);
        return;
      }
      
      console.log("Creating checkout session with Stripe...");
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      console.log("Using price ID:", priceId);
      
      // Prepare the checkout parameters
      const checkoutParams = {
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: returnUrl,
        cancelUrl: window.location.origin,
        customerEmail: userData.user.email,
      };
      
      console.log("Checkout parameters:", JSON.stringify(checkoutParams));
      
      // Redirect to Stripe checkout
      const { error } = await stripeJs.redirectToCheckout(checkoutParams);
      
      if (error) {
        console.error("Stripe redirect error:", error);
        toast.error(`Stripe error: ${error.message}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Direct checkout error:", error);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function to handle payment via Stripe
  const handlePayment = async () => {
    return handleDirectCheckout();
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
                disabled={isLoading || !stripeJs}
                className={`w-full py-3 rounded-md font-medium transition-all bg-matrix-primary text-black hover:bg-opacity-90 ${
                  (isLoading || !stripeJs) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Processing..." : !stripeJs ? "Loading Stripe..." : "Purchase Now"}
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
