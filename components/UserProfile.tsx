import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getSubscriptionStatus } from '../lib/customers';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      if (!user) return;
      
      try {
        const sub = await getSubscriptionStatus(user.id);
        setSubscription(sub);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.origin + '/account',
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      
      <div className="user-info">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      <div className="subscription-info">
        <h2>Subscription</h2>
        {loading ? (
          <p>Loading subscription information...</p>
        ) : subscription ? (
          <>
            <p><strong>Status:</strong> {subscription.status}</p>
            <p><strong>Plan:</strong> {subscription.items.data[0].price.nickname || 'Unknown Plan'}</p>
            <p><strong>Current Period Ends:</strong> {new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
            
            <button 
              onClick={handleManageSubscription}
              className="btn btn-secondary"
            >
              Manage Subscription
            </button>
          </>
        ) : (
          <p>You don't have an active subscription.</p>
        )}
      </div>

      <button 
        onClick={() => signOut()}
        className="btn btn-danger mt-4"
      >
        Sign Out
      </button>
    </div>
  );
} 