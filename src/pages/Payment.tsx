import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrentUrl } from '../lib/utils';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user, hasSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSubscription) {
      navigate('/dashboard');
    }
  }, [hasSubscription, navigate]);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Load Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Get the price ID from environment variables
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      if (!priceId) {
        throw new Error('Stripe price ID not configured');
      }

      // Create Stripe Checkout session
      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: getCurrentUrl('/dashboard'),
        cancelUrl: getCurrentUrl('/payment'),
        clientReferenceId: user.id, // Pass the user ID to identify the customer
      });

      if (error) {
        throw error;
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
      <div className="max-w-md w-full space-y-8 bg-matrix-card p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-matrix-primary mb-2">
            Subscribe to Matrix Resource Hub
          </h2>
          <p className="text-gray-400 mb-6">
            Get access to all resources and features
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-matrix-border rounded-lg p-6">
            <h3 className="text-xl font-semibold text-matrix-primary mb-2">
              Professional Plan
            </h3>
            <p className="text-gray-400 mb-4">
              Full access to all features and resources
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-matrix-primary mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Unlimited access to all resources
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-matrix-primary mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Priority support
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-matrix-primary mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Early access to new features
              </li>
            </ul>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-matrix-primary text-black font-semibold py-2 px-4 rounded-md hover:bg-matrix-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="text-red-500 text-center mt-4">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
