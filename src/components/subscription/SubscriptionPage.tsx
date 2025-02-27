
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PricingTable from "../PricingTable";
import { createSubscription } from "../../lib/supabase";

const SubscriptionPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Function to handle subscription selection
  const handleSubscribe = async (plan: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would redirect to payment processing
      toast.success(`Processing ${plan} plan subscription...`);
      
      // Create a subscription record in the database
      const subscription = await createSubscription(plan, 30); // 30-day subscription
      
      if (!subscription) {
        throw new Error("Failed to create subscription");
      }
      
      toast.success(`Successfully subscribed to ${plan} plan!`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to process subscription. Please try again.");
    } finally {
      setIsLoading(false);
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
      </div>
      
      <div className="mb-8">
        <PricingTable onSubscribe={handleSubscribe} disabled={isLoading} />
      </div>
      
      <div className="max-w-2xl mx-auto bg-matrix-muted p-6 rounded-lg border border-matrix-border mt-12">
        <h3 className="text-xl font-semibold mb-3 text-white">
          Why Subscribe to AI Unlocked?
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
