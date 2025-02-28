
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@13.9.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-billing-cycle',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const { plan, userId, email, returnUrl } = await req.json();
    const billingCycle = req.headers.get('X-Billing-Cycle') || 'monthly';
    
    if (!plan) {
      throw new Error('Plan is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!email) {
      throw new Error('Email is required');
    }
    
    if (!returnUrl) {
      throw new Error('Return URL is required');
    }
    
    console.log(`Creating checkout session for ${plan} plan, billing cycle: ${billingCycle}`);
    console.log(`Return URL: ${returnUrl}`);
    
    // Map plan names to price IDs (these would be your actual Stripe price IDs)
    const priceMap = {
      Starter: {
        monthly: 'price_starter_monthly',
        annually: 'price_starter_annually'
      },
      Professional: {
        monthly: 'price_professional_monthly',
        annually: 'price_professional_annually'
      },
      Enterprise: {
        monthly: 'price_enterprise_monthly',
        annually: 'price_enterprise_annually'
      }
    };

    // Get the appropriate price ID based on plan and billing cycle
    const priceId = priceMap[plan as keyof typeof priceMap]?.[billingCycle as 'monthly' | 'annually'];
    
    if (!priceId) {
      throw new Error(`Invalid plan (${plan}) or billing cycle (${billingCycle})`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${returnUrl}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?payment_status=cancelled`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
        billingCycle
      }
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error(`Error creating checkout session: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
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
