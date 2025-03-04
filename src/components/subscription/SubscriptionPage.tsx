import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase, getSubscription, isSubscribed, redirectToCustomerPortal } from "../../lib/supabase";
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, CircularProgress, Alert, Box, Paper } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';

// Add Stripe to the Window interface
declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [portalRedirectLoading, setPortalRedirectLoading] = useState<boolean>(false);
  const [portalRedirectError, setPortalRedirectError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Check if the user has an active subscription
      const subscribed = await isSubscribed();
      setHasSubscription(subscribed);

      if (subscribed) {
        // Get subscription details for display
        const subscription = await getSubscription();
        setSubscriptionDetails(subscription);
      }
    } catch (err) {
      setError('Error checking subscription status. Please try again.');
      console.error('Error checking subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalRedirectLoading(true);
    setPortalRedirectError(null);
    
    try {
      // Get the URL for the customer portal
      const portalUrl = await redirectToCustomerPortal(window.location.origin + '/subscription');
      
      if (portalUrl) {
        // Redirect to the Stripe Customer Portal
        window.location.href = portalUrl;
      } else {
        throw new Error('Failed to get customer portal URL');
      }
    } catch (err) {
      setPortalRedirectError('Error redirecting to subscription management. Please try again.');
      console.error('Error redirecting to customer portal:', err);
      setPortalRedirectLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Subscription Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {portalRedirectError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {portalRedirectError}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Subscription Status
        </Typography>
        
        {hasSubscription ? (
          <div>
            <Alert severity="success" sx={{ mb: 3 }}>
              You have an active subscription!
            </Alert>
            
            {subscriptionDetails && (
              <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1">
                  <strong>Plan:</strong> {subscriptionDetails.plan || 'Standard Plan'}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {subscriptionDetails.status}
                </Typography>
                <Typography variant="body1">
                  <strong>Current Period Ends:</strong> {formatDate(subscriptionDetails.current_period_end)}
                </Typography>
                {subscriptionDetails.cancel_at_period_end && (
                  <Typography variant="body1" color="warning.main">
                    Your subscription will cancel at the end of the current period.
                  </Typography>
                )}
              </Card>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleManageSubscription}
              disabled={portalRedirectLoading}
              startIcon={portalRedirectLoading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              {portalRedirectLoading ? 'Redirecting...' : 'Manage Your Subscription'}
            </Button>
          </div>
        ) : (
          <div>
            <Alert severity="info" sx={{ mb: 3 }}>
              You don't have an active subscription.
            </Alert>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleManageSubscription}
              disabled={portalRedirectLoading}
              startIcon={portalRedirectLoading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              {portalRedirectLoading ? 'Redirecting...' : 'Subscribe Now'}
            </Button>
          </div>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Subscription Benefits
        </Typography>
        <ul>
          <li>Access to all Matrix resources</li>
          <li>Premium content updates</li>
          <li>Priority support</li>
          <li>Advanced features</li>
        </ul>
      </Paper>
    </div>
  );
};

export default SubscriptionPage;
