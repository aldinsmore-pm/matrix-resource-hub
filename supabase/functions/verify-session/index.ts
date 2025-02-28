
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
    // Get session ID from request body
    const { sessionId, userId } = await req.json();
    
    if (!sessionId || !userId) {
      throw new Error("Missing required parameters");
    }

    console.log(`Verifying session ${sessionId} for user ${userId}`);

    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== 'paid') {
      throw new Error("Payment not completed or session invalid");
    }

    // Verify the user ID from the session matches
    if (session.client_reference_id !== userId) {
      throw new Error("User ID mismatch");
    }

    console.log(`Session verified: ${sessionId}, payment status: ${session.payment_status}`);

    // Get subscription info
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Create a subscription record in the database
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        customer_id: session.customer as string,
        subscription_id: subscriptionId,
        status: subscription.status,
        plan: session.metadata?.plan || "Professional",
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating subscription record: ${error.message}`);
      throw new Error(`Failed to create subscription record: ${error.message}`);
    }

    console.log(`Subscription created in database for user ${userId}`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, subscription: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`Error verifying session: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
