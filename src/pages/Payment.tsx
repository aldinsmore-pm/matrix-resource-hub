import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrentUrl } from '../lib/utils';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user, hasSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSubscription) {
      console.log('User has subscription, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [hasSubscription, navigate]);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Get current session to ensure we have fresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No active session found');
        navigate('/login');
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      console.log('Creating Stripe checkout session...');
      
      // Call Supabase Edge Function to create Stripe customer and get session
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-customer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            userId: session.user.id,
            successUrl: getCurrentUrl('/dashboard'),
            cancelUrl: getCurrentUrl('/payment'),
            priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout session creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const result = await response.json();
      console.log('Checkout session created:', result.sessionId);

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (redirectError) {
        console.error('Redirect to checkout failed:', redirectError);
        throw redirectError;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMsg(error.message || 'Failed to process payment');
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-matrix-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-matrix-primary">
          Professional Plan
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Full access to all resources</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Priority support</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Early access to new features</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full bg-matrix-primary text-white py-3 px-4 rounded-md font-medium transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-matrix-primary-dark'}`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            'Subscribe Now'
          )}
        </button>
      </div>
    </div>
  );
};

export default Payment;
