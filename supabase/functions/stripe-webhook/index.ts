
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the stripe signature from the request
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe signature in request");
      return new Response(
        JSON.stringify({ error: "No stripe signature in request" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the raw request body
    const body = await req.text();
    
    // Get the webhook secret from the environment
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("Webhook secret not found");
      return new Response(
        JSON.stringify({ error: "Webhook secret not found" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Verify the webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Event type: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        
        // Get the customer ID and metadata from the session
        const userId = session.metadata.user_id || session.client_reference_id;
        
        if (!userId) {
          console.error("No user ID found in session metadata or client_reference_id");
          return new Response(
            JSON.stringify({ error: "No user ID found" }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        console.log(`User ID from session: ${userId}`);
        
        // Create a subscription record for the user
        // Set end date to 100 years in the future (effectively lifetime)
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100);
        
        const { data, error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan: "Professional",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
          });
        
        if (error) {
          console.error(`Error creating subscription: ${error.message}`);
          return new Response(
            JSON.stringify({ error: `Database Error: ${error.message}` }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        console.log(`Subscription created for user ${userId}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
