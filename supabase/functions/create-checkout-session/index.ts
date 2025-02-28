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
    
    console.log(`Creating checkout session for ${plan} plan, billing cycle: ${billingCycle}`);
    
    // Currently, only an annual price is available for product prod_RrGq7yAIjtfBHy
    // Using the correct price ID provided
    const productPrices = {
      annually: 'price_1QxYIYRdb4qpGphFhXDsnDLT' // Correct annual price ID
    };

    // Always use annual billing since that's the only option available
    const priceId = productPrices.annually;
    
    // Inform if user attempted to use monthly billing
    if (billingCycle === 'monthly') {
      console.log('Monthly billing requested but only annual billing is available. Defaulting to annual billing.');
    }

    // Create checkout session with the product linked to the price
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
        plan, // Keep the plan name for reference
        billingCycle: 'annually', // Always annual since that's the only option
        productId: 'prod_RrGq7yAIjtfBHy' // Using the correct product ID
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
