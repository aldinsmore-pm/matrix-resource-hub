
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SubscriptionPage from "../components/subscription/SubscriptionPage";
import { supabase, isSubscribed } from "../lib/supabase";

const Subscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const { data } = await supabase.auth.getUser();
        
        // Check for authentication errors in URL
        const urlError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (urlError === 'access_denied' && errorDescription?.includes('Email link is invalid or has expired')) {
          setError('Your email confirmation link has expired or is invalid.');
          
          // Try to get email from local storage or URL
          const storedEmail = localStorage.getItem('lastSignupEmail');
          if (storedEmail) {
            setEmail(storedEmail);
          }
          
          setLoading(false);
          return;
        }
        
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

  // Listen for hash fragment in URL that could contain auth tokens
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Check if there's a hash fragment with tokens
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token") || hash.includes("error"))) {
          // Process the hash fragment to set the session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Auth redirect error:", error);
            throw error;
          }
          
          if (data.session) {
            // Continue with subscription flow or check existing subscription
            const hasSubscription = await isSubscribed();
            
            if (hasSubscription) {
              navigate("/dashboard");
            }
          }
        }
      } catch (error) {
        console.error("Error handling auth redirect:", error);
      }
    };
    
    handleAuthRedirect();
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw error;
      }

      toast.success('A new confirmation email has been sent. Please check your inbox.');
      // Store the email for future use
      localStorage.setItem('lastSignupEmail', email);
      
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast.error(error.message || 'Failed to resend confirmation email');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-matrix-bg">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto card-container rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Email Confirmation Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Email Address</label>
              <input
                type="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-matrix-border rounded-md bg-matrix-muted text-white focus:outline-none focus:ring-1 focus:ring-matrix-primary focus:border-matrix-primary"
                placeholder="you@example.com"
              />
            </div>

            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-matrix-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-matrix-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Resend Confirmation Email"}
            </button>
            
            <div className="mt-4 text-center">
              <a href="/login" className="text-matrix-primary hover:underline text-sm">
                Back to Login
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
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
