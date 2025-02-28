import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PricingTable from "../PricingTable";
import { supabase } from "../../lib/supabase";
import { SUBSCRIPTION_TEST_MODE, simulateCheckout } from "./testMode";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

const SubscriptionPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");
  const [edgeFunctionError, setEdgeFunctionError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to handle fallback to test mode
  const handleFallbackToTestMode = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    
    try {
      // Get user information
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("You must be logged in to subscribe");
      }
      
      toast.info(`[FALLBACK MODE] Processing ${selectedPlan} plan subscription...`);
      
      // Use the test implementation as fallback
      const result = await simulateCheckout(
        selectedPlan, 
        userData.user.id, 
        userData.user.email || 'test@example.com',
        billingCycle
      );
      
      if (result.success) {
        toast.success(result.message);
        // Redirect to dashboard
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        throw new Error(result.error || "Failed to process test subscription");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process fallback subscription. Please try again.");
    } finally {
      setIsLoading(false);
      setEdgeFunctionError(null);
      setSelectedPlan(null);
      setDebugInfo(null);
    }
  };

  // Function to handle subscription selection
  const handleSubscribe = async (plan: string) => {
    setIsLoading(true);
    setSelectedPlan(plan);
    setDebugInfo(null);
    
    try {
      // Get user information
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("You must be logged in to subscribe");
      }
      
      toast.info(`Processing ${plan} plan subscription...`);
      
      // Check if we're in test mode
      if (SUBSCRIPTION_TEST_MODE) {
        // Use the test implementation
        toast.info("[TEST MODE] Using test subscription flow");
        
        const result = await simulateCheckout(
          plan, 
          userData.user.id, 
          userData.user.email || 'test@example.com',
          billingCycle
        );
        
        if (result.success) {
          toast.success(result.message);
          // Redirect to dashboard
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          throw new Error(result.error || "Failed to process test subscription");
        }
      } else {
        // Use the actual URL of the current deployment for the return URL
        // This ensures the right URL regardless of environment
        const returnUrl = `${window.location.origin}/subscription-confirmation`;
        
        toast.loading("Connecting to Stripe checkout...", {
          id: "stripe-checkout",
          duration: 5000
        });
        
        try {
          // Add debug info
          setDebugInfo("Invoking Edge Function create-checkout-session...");
          
          // Call our Supabase Edge Function to create a Stripe checkout session
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
              plan,
              userId: userData.user.id,
              email: userData.user.email,
              returnUrl,
            },
            headers: {
              'X-Billing-Cycle': billingCycle
            }
          });
          
          setDebugInfo(prev => `${prev}\nResponse received. Data: ${JSON.stringify(data)}, Error: ${error ? JSON.stringify(error) : 'none'}`);
          
          if (error) {
            toast.error("Error creating checkout session", {
              id: "stripe-checkout"
            });
            
            // Store the error message for display
            setEdgeFunctionError(error.message || "Failed to create checkout session");
            throw new Error(error.message || "Failed to create checkout session");
          }
          
          if (!data?.url) {
            toast.error("Invalid checkout response", {
              id: "stripe-checkout"
            });
            setEdgeFunctionError("No checkout URL returned from the server");
            throw new Error("No checkout URL returned");
          }
          
          // Update toast before redirecting
          toast.success("Redirecting to secure payment page...", {
            id: "stripe-checkout"
          });
          
          setDebugInfo(prev => `${prev}\nRedirecting to Stripe checkout: ${data.url.substring(0, 50)}...`);
          
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } catch (invokeError: any) {
          console.error("Edge Function Error:", invokeError);
          setDebugInfo(prev => `${prev}\nEdge Function Error: ${JSON.stringify(invokeError)}`);
          
          // Set a more descriptive error message
          if (invokeError.message?.includes("non-2xx status code")) {
            setEdgeFunctionError(
              "The Edge Function is returning an error. This occurs because the updated price ID hasn't been deployed to Supabase. " +
              "For now, you can use the test mode to bypass Stripe and continue with your subscription."
            );
          } else if (invokeError.message?.includes("No such price")) {
            setEdgeFunctionError(
              "The price ID in the Supabase Edge Function doesn't match the one in your Stripe account. " +
              "The correct price ID (price_1QxYIYRdb4qpGphFhXDsnDLT) needs to be deployed to the Edge Function."
            );
          } else {
            setEdgeFunctionError(
              "An error occurred communicating with the Stripe checkout service. " +
              "You can use test mode to continue or try again later."
            );
          }
          
          toast.error("Stripe checkout unavailable", {
            id: "stripe-checkout"
          });
          
          throw invokeError;
        }
      }
      
    } catch (error: any) {
      console.error("Subscription error:", error);
      if (!edgeFunctionError) {
        toast.error(error.message || "Failed to process subscription. Please try again.");
      }
    } finally {
      if (!edgeFunctionError) {
        setIsLoading(false);
        setSelectedPlan(null);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Choose Your <span className="text-matrix-primary">Subscription Plan</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Select the plan that best fits your needs. All plans include access to our core features,
          with additional benefits for higher tiers.
        </p>
        
        {SUBSCRIPTION_TEST_MODE && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-md max-w-2xl mx-auto">
            <p className="text-sm font-medium">⚠️ Test Mode Active</p>
            <p className="text-xs mt-1">
              Subscriptions are being processed in test mode. No actual payments will be made.
              Subscription data will be saved to the database directly.
            </p>
          </div>
        )}
        
        {!SUBSCRIPTION_TEST_MODE && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 text-blue-300 p-3 rounded-md max-w-2xl mx-auto">
            <p className="text-sm font-medium">🔒 Secure Payments via Stripe</p>
            <p className="text-xs mt-1">
              You'll be redirected to Stripe's secure checkout to complete your subscription.
              For testing, use card number: 4242 4242 4242 4242 with any future date and CVC.
            </p>
          </div>
        )}
        
        {edgeFunctionError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-md max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p className="text-sm font-medium">Stripe Integration Issue</p>
            </div>
            <p className="text-xs mb-3">
              {edgeFunctionError}
            </p>
            <p className="text-xs mb-4 text-amber-300">
              <strong>Recommendation:</strong> Use test mode to create a subscription directly in the database without payment processing. 
              This will allow you to continue using the application while the Stripe integration is being fixed.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEdgeFunctionError(null);
                  setDebugInfo(null);
                  setIsLoading(false);
                }}
              >
                Try Again
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleFallbackToTestMode}
                disabled={isLoading}
              >
                Use Test Mode
              </Button>
            </div>
            
            {debugInfo && (
              <div className="mt-4 p-2 bg-black/30 rounded text-left">
                <p className="text-xs font-mono text-gray-400 mb-1">Debug Information:</p>
                <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                  {debugInfo}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <PricingTable 
          onSubscribe={handleSubscribe} 
          disabled={isLoading} 
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />
      </div>
      
      <div className="max-w-2xl mx-auto bg-matrix-muted p-6 rounded-lg border border-matrix-border mt-12">
        <h3 className="text-xl font-semibold mb-3 text-white">
          Why Subscribe to Aire?
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
  );
};

export default SubscriptionPage;
