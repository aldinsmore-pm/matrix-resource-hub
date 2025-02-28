
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@13.9.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { sessionId, userId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Verifying checkout session: ${sessionId} for user: ${userId}`);
    
    // Retrieve the session to verify its status
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify that the session is completed and has successful payment
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new Error('Payment was not successful');
    }
    
    // Verify that the user ID matches
    if (session.client_reference_id !== userId) {
      throw new Error('User ID mismatch');
    }
    
    console.log('Payment verification successful');
    
    // Get subscription ID from the session
    const subscriptionId = session.subscription;
    
    if (!subscriptionId) {
      throw new Error('No subscription was created');
    }
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    
    // Save subscription information to the database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        id: subscription.id,
        user_id: userId,
        status: subscription.status,
        plan: session.metadata?.plan || 'unknown',
        stripe_customer_id: session.customer,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      });
    
    if (dbError) {
      console.error(`Error saving subscription to database: ${dbError.message}`);
      throw new Error('Failed to save subscription information');
    }
    
    console.log(`Subscription saved to database: ${subscription.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified and subscription activated'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error(`Error verifying checkout session: ${error.message}`);
    
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
