import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStripeJs } from '../lib/stripe';

type SubscriptionButtonProps = {
  priceId: string;
};

export default function SubscriptionButton({ priceId }: SubscriptionButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscription = async () => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }

    setLoading(true);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price: priceId,
          successUrl: `${window.location.origin}/account?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const stripe = await getStripeJs();
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSubscription} 
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? 'Loading...' : 'Subscribe'}
    </button>
  );
} 