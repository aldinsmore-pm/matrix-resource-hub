import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

// Add Stripe to the Window interface
declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}

const SubscriptionPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [useTestMode, setUseTestMode] = useState(true);
  const [testMethod, setTestMethod] = useState<'direct' | 'fetch' | 'supabase'>('direct');
  const [stripeJs, setStripeJs] = useState<any>(null);

  // Load Stripe.js on component mount
  useEffect(() => {
    const loadStripe = () => {
      try {
        // First, check if environment variable is available
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        
        // Detailed logs to help diagnose issues
        console.log("SubscriptionPage - Stripe initialization - Environment variables check:");
        console.log("VITE_STRIPE_PUBLISHABLE_KEY available:", !!publishableKey);
        
        if (!publishableKey) {
          console.error("Stripe publishable key is not set in environment variables.");
          
          // Fallback to hard-coded key for testing only - NOT recommended for production
          const fallbackKey = "pk_test_51QxYA5Rdb4qpGphFqrRfO4mXRpKL6x9qZjP0opKHvj8JcDiZsMqwqfkUwwFDCc43HyxAXTQDh4XotfXNop1si8z000bFIaLScD";
          console.log("Using fallback key for development purposes");
          
          initializeStripe(fallbackKey);
          return;
        }
        
        initializeStripe(publishableKey);
      } catch (error) {
        console.error("Error loading Stripe:", error);
        toast.error("Payment system initialization error. Please try again later.");
        // Retry after a delay
        setTimeout(loadStripe, 2000);
      }
    };
    
    const initializeStripe = (key: string) => {
      if (!window.Stripe) {
        console.error("Stripe.js is not loaded. Make sure the script is included in the HTML.");
        // Retry loading after a delay
        setTimeout(() => loadStripe(), 1000);
        return;
      }
      
      try {
        const stripeInstance = window.Stripe(key);
        setStripeJs(stripeInstance);
        console.log("Stripe initialized successfully");
      } catch (error) {
        console.error("Error initializing Stripe:", error);
        toast.error("Payment system error. Please contact support if the issue persists.");
      }
    };
    
    loadStripe();
  }, []);

  // Function to handle purchase via direct Stripe checkout (for testing)
  const handleDirectCheckout = async () => {
    setIsLoading(true);
    
    try {
      if (!stripeJs) {
        toast.error("Stripe.js is not loaded yet. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      
      toast.info("Creating direct checkout session...");
      
      // Get user info
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to make a purchase");
        setIsLoading(false);
        return;
      }
      
      // Create checkout session
      const { error } = await stripeJs.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl: window.location.origin + "/payment-success?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: window.location.origin + "/payment",
        clientReferenceId: userData.user.id,
        customerEmail: userData.user.email,
      });
      
      if (error) {
        console.error("Stripe direct checkout error:", error);
        toast.error(`Checkout error: ${error.message}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Direct checkout error:", error);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function to handle purchase using direct fetch to Edge Function
  const handleFetchCheckout = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Preparing fetch checkout...");
      
      // Get the current URL for the return URL
      const returnUrl = window.location.origin + "/payment-success";
      
      // Check if user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        toast.error("You must be logged in to make a purchase");
        setIsLoading(false);
        return;
      }
      
      console.log("Calling Edge Function via fetch with token:", token.substring(0, 10) + '...');
      
      // Call the Edge Function directly using fetch
      const response = await fetch('http://localhost:54321/functions/v1/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Adding additional headers that might be required
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-client-info': 'supabase-js/2.x'
        },
        body: JSON.stringify({
          returnUrl
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", response.status, errorText);
        toast.error(`Failed to create checkout session: ${response.status} ${response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
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
      console.error("Fetch checkout error:", error);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function to handle purchase via Stripe
  const handlePurchase = async () => {
    // Choose the appropriate method based on test settings
    if (useTestMode) {
      if (testMethod === 'direct') {
        return handleDirectCheckout();
      } else if (testMethod === 'fetch') {
        return handleFetchCheckout();
      } else {
        // Supabase client method - but we'll show a warning since it's having issues
        toast.warning("Using Supabase Edge Functions - this may not work in local development. Consider using direct Stripe checkout instead.");
        // Continue with the regular flow below
      }
    } else {
      // Non-test mode, we default to direct checkout for stability
      return handleDirectCheckout();
    }
    
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
      
      // Log Supabase configuration for debugging
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("Supabase functions client:", supabase.functions);
      console.log("Current user:", userData.user);
      console.log("JWT token:", (await supabase.auth.getSession()).data.session?.access_token);
      
      // Use the Supabase client to call the Edge Function
      try {
        toast.info("Attempting to call Edge Function...");
        
        // Debug the request that will be sent
        console.log("Edge Function params:", {
          function: 'create-checkout',
          body: { returnUrl }
        });
        
        // Get the auth session for the token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        if (!token) {
          toast.error("You must be logged in to make a purchase");
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            returnUrl
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (error) {
          console.error("Checkout function error:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
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
      } catch (functionError) {
        console.error("Function invoke error details:", functionError);
        console.error("Error stack:", functionError.stack);
        toast.error(`Failed to send a request to the Edge Function: ${functionError.message}`);
        setIsLoading(false);
      }
    } catch (error) {
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
          
          <div className="mt-4">
            <label className="flex items-center justify-center text-gray-300">
              <input
                type="checkbox"
                className="mr-2"
                checked={useTestMode}
                onChange={(e) => setUseTestMode(e.target.checked)}
              />
              Use test mode
            </label>
            
            {useTestMode && (
              <div className="mt-2 flex justify-center space-x-4">
                <label className="text-gray-300">
                  <input
                    type="radio"
                    name="testMethod"
                    className="mr-1"
                    checked={testMethod === 'direct'}
                    onChange={() => setTestMethod('direct')}
                  />
                  Direct Stripe
                </label>
                <label className="text-gray-300">
                  <input
                    type="radio"
                    name="testMethod"
                    className="mr-1"
                    checked={testMethod === 'fetch'}
                    onChange={() => setTestMethod('fetch')}
                  />
                  Fetch API
                </label>
                <label className="text-gray-300">
                  <input
                    type="radio"
                    name="testMethod"
                    className="mr-1"
                    checked={testMethod === 'supabase'}
                    onChange={() => setTestMethod('supabase')}
                  />
                  Supabase
                </label>
              </div>
            )}
          </div>
          
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
