import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

const SubscriptionConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "cancelled" | "processing" | "error">("processing");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const paymentStatus = searchParams.get("payment_status");
        const sessionIdParam = searchParams.get("session_id");
        
        setSessionId(sessionIdParam);

        if (paymentStatus === "cancelled") {
          setStatus("cancelled");
          toast.error("Subscription cancelled");
          return;
        }

        if (paymentStatus === "success" && sessionIdParam) {
          // In a production environment, you'd verify the session with your backend
          // For now, we'll just display success based on URL params
          setStatus("success");
          toast.success("Subscription successful!");
          
          // Get user information for display purposes
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            console.log("User subscribed:", userData.user.email);
          }
          
          return;
        }

        // If we reached here, something unexpected happened
        setStatus("error");
        toast.error("Unable to determine subscription status");
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setStatus("error");
        toast.error("An error occurred while processing your subscription");
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [searchParams, navigate]);

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-matrix-primary mb-4">Subscription Successful!</h2>
            <p className="mb-2">
              Thank you for subscribing. Your account has been successfully updated with your new subscription plan.
            </p>
            {sessionId && (
              <p className="text-xs text-gray-400 mb-6">
                Session ID: {sessionId}
              </p>
            )}
            <div className="mt-8">
              <Button onClick={() => navigate("/dashboard")} size="lg">
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      case "cancelled":
        return (
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-500 mb-4">Subscription Cancelled</h2>
            <p className="mb-6">
              You've cancelled the subscription process. No charges were made to your account.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/subscription")} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      case "error":
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 mb-4">Something Went Wrong</h2>
            <p className="mb-4">
              We encountered an error while processing your subscription.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              If you were charged, please contact our support team for assistance.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/subscription")} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-matrix-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Processing your subscription...</p>
            <p className="text-sm text-gray-400 mt-2">
              Please wait while we confirm your payment details.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <div className="bg-matrix-card p-8 rounded-lg shadow-lg border border-matrix-border">
        {renderContent()}
      </div>
    </div>
  );
};

export default SubscriptionConfirmation; 