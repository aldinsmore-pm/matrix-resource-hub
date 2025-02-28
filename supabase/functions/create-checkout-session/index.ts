
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.1.1?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Get request body
    const { plan, userId, email, returnUrl } = await req.json();
    
    if (!plan || !userId || !email || !returnUrl) {
      throw new Error("Missing required parameters");
    }

    console.log(`Creating checkout session for user ${userId}, plan ${plan}`);

    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Define price mapping logic - both as fallbacks and from env variables
    const PRICE_MAPPING = {
      "Starter": {
        monthly: "price_1ParIkJ4RtGdwHKhTlKJxZPJ", // Example fallback price ID
        annually: "price_1ParJVJ4RtGdwHKhVQYqy1Pu" // Example fallback price ID
      },
      "Professional": {
        monthly: "price_1ParL2J4RtGdwHKhw1GKGWky", // Example fallback price ID
        annually: "price_1ParLKJ4RtGdwHKhK0cwyvCz" // Example fallback price ID
      },
      "Enterprise": {
        monthly: "price_1ParLtJ4RtGdwHKhBqrIEYvJ", // Example fallback price ID
        annually: "price_1ParM6J4RtGdwHKhDIQi9XsK" // Example fallback price ID
      }
    };

    // Determine the billing cycle from the metadata (default to monthly)
    const billing = req.headers.get("X-Billing-Cycle") || "monthly";
    
    // Get the price ID
    let priceId = PRICE_MAPPING[plan]?.[billing] || PRICE_MAPPING[plan]?.monthly;

    // Override with environment variables if available
    if (billing === "monthly") {
      if (plan === "Starter" && Deno.env.get("STRIPE_STARTER_PRICE_ID")) {
        priceId = Deno.env.get("STRIPE_STARTER_PRICE_ID") || "";
      } else if (plan === "Professional" && Deno.env.get("STRIPE_PROFESSIONAL_PRICE_ID")) {
        priceId = Deno.env.get("STRIPE_PROFESSIONAL_PRICE_ID") || "";
      } else if (plan === "Enterprise" && Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID")) {
        priceId = Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID") || "";
      }
    }

    if (!priceId) {
      throw new Error(`Could not determine price ID for plan: ${plan}`);
    }

    console.log(`Using price ID: ${priceId} for plan ${plan}`);

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
      cancel_url: `${returnUrl}?payment_status=cancelled`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    console.log(`Created checkout session: ${session.id} for user ${userId}`);

    // Return the session URL for redirect
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`Error creating checkout session: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
