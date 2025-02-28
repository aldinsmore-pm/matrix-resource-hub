
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import Stripe from "https://esm.sh/stripe@13.9.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { sessionId, userId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Verifying session ${sessionId} for user ${userId}`);
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error('Invalid session ID');
    }
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }
    
    // Verify that this session belongs to the user
    if (session.client_reference_id !== userId) {
      throw new Error('Session does not belong to this user');
    }
    
    console.log(`Session verified for user ${userId}`);
    
    // Extract subscription details from the session
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;
    
    if (!subscriptionId) {
      throw new Error('No subscription ID found in session');
    }
    
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      throw new Error('Invalid subscription ID');
    }
    
    // Extract plan details from metadata or subscription
    const plan = session.metadata?.plan || 'unknown';
    const billingCycle = session.metadata?.billingCycle || 'monthly';
    
    // Calculate current period dates
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Save subscription in Supabase
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        id: subscriptionId,
        user_id: userId,
        customer_id: customerId,
        plan: plan,
        status: subscription.status,
        billing_cycle: billingCycle,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .select();
    
    if (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
    
    console.log(`Subscription saved: ${subscriptionId}`);
    
    return new Response(
      JSON.stringify({ success: true, subscription: data[0] }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error(`Error verifying session: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
