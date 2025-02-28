
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

    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Define price IDs for each plan
    // You'll need to create these products and prices in Stripe dashboard
    const PRICE_IDS: Record<string, string> = {
      "Starter": Deno.env.get("STRIPE_STARTER_PRICE_ID") || "",
      "Professional": Deno.env.get("STRIPE_PROFESSIONAL_PRICE_ID") || "",
      "Enterprise": Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID") || "",
    };

    if (!PRICE_IDS[plan]) {
      throw new Error(`Invalid plan selected: ${plan}`);
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?payment_status=success`,
      cancel_url: `${returnUrl}?payment_status=cancelled`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    // Return the session URL for redirect
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
