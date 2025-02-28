import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

const SubscriptionPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle purchase via Stripe
  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Preparing checkout...");
      
      // Get the current URL for the return URL
      const returnUrl = window.location.origin;
      
      // Call the Supabase Edge Function to create a checkout session
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error("You must be logged in to make a purchase");
      }
      
      // Get JWT token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Authentication session not found");
      }
      
      // Use the Supabase client to call the Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          productId: "prod_RrL1RLRnascFV8",
          returnUrl
        }
      });
      
      if (error) {
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
      
      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session: No URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to process purchase. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Access <span className="text-matrix-primary">Aire</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get access to our complete platform with a one-time purchase.
        </p>
      </div>
      
      <div className="max-w-xl mx-auto">
        <div className="bg-matrix-muted p-8 rounded-lg border border-matrix-border">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-matrix-primary mb-2">$99</div>
            <p className="text-gray-300">One-time purchase for lifetime access</p>
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
            onClick={handlePurchase}
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
        
        <div className="bg-matrix-muted p-6 rounded-lg border border-matrix-border mt-8">
          <h3 className="text-xl font-semibold mb-3 text-white">
            Why Choose Aire?
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <div className="text-matrix-primary mr-2">•</div>
              <span>Access to premium AI implementation resources and tools</span>
            </li>
            <li className="flex items-start">
              <div className="text-matrix-primary mr-2">•</div>
              <span>Exclusive industry reports and analysis</span>
            </li>
            <li className="flex items-start">
              <div className="text-matrix-primary mr-2">•</div>
              <span>Priority support from our AI specialists</span>
            </li>
            <li className="flex items-start">
              <div className="text-matrix-primary mr-2">•</div>
              <span>Regular updates on emerging AI technologies and best practices</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
