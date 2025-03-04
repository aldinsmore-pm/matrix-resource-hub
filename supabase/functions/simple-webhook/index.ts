import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.11.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Create a Stripe client
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Simple handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the raw request body
    const body = await req.text();
    console.log("Received webhook event");
    
    // Get signature from header
    const signature = req.headers.get("stripe-signature");
    console.log("Signature available:", !!signature);
    
    // Get webhook secret (Stripe CLI secret for testing)
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const stripeCLISecret = "whsec_32ef7bd0f8ccf8c248a983de0713e7e9a41d2a41f9dbd3085864411c23556076";
    
    // Parse the event
    let event;
    try {
      // First try with configured webhook secret
      if (signature && webhookSecret) {
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
          console.log("Verified with configured webhook secret");
        } catch (e) {
          // If that fails, try with CLI secret
          console.log("Failed with configured secret, trying CLI secret");
          event = await stripe.webhooks.constructEventAsync(body, signature, stripeCLISecret);
          console.log("Verified with CLI webhook secret");
        }
      } else {
        // For testing without verification
        console.log("No signature or webhook secret, parsing body directly");
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { status: 400, headers: { ...corsHeaders } }
      );
    }

    // Log the event
    console.log(`Event type: ${event.type}`);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bobnfoppduagvvaktebt.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYm5mb3BwZHVhZ3Z2YWt0ZWJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAyNDEwMywiZXhwIjoyMDU2NjAwMTAzfQ.K8SnUlSLGgZp--XqS5sBnh3gRxX2SfrRnaS3_gXjxhw";
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service role key available:", !!supabaseKey);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Only handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      console.log("Processing checkout.session.completed event");
      
      const session = event.data.object;
      console.log("Session ID:", session.id);
      
      // Get client_reference_id (user ID)
      const userId = session.client_reference_id;
      console.log("User ID from client_reference_id:", userId);
      
      // Fallback if no client_reference_id is present
      const fallbackUserId = "62779a66-1de0-405d-a906-ca06fbff867e";
      const effectiveUserId = userId || fallbackUserId;
      
      if (!userId) {
        console.log(`No client_reference_id in session, using fallback: ${fallbackUserId}`);
      }
      
      // Get subscription information if available
      let subscriptionId = null;
      if (session.subscription) {
        console.log("Subscription ID from session:", session.subscription);
        subscriptionId = `simple_webhook_${session.subscription}`;
      } else {
        // Generate a manual subscription ID for testing
        subscriptionId = `simple_webhook_${Date.now()}`;
        console.log("No subscription in session, using generated ID:", subscriptionId);
      }
      
      // Calculate subscription period
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      console.log("Inserting subscription record with the following data:");
      console.log({
        user_id: effectiveUserId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        plan: "matrix_subscription",
        current_period_start: startDate,
        current_period_end: endDate,
      });
      
      // Insert the subscription into the database
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .insert([
            {
              user_id: effectiveUserId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              plan: "matrix_subscription",
              current_period_start: startDate,
              current_period_end: endDate,
            },
          ])
          .select();
        
        if (error) {
          console.error("Database insertion error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to insert subscription: ${error.message}`);
        }
        
        console.log("Successfully inserted subscription:", JSON.stringify(data, null, 2));
        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders } }
        );
      } catch (insertError) {
        console.error("Error during database operation:", insertError.message);
        return new Response(
          JSON.stringify({ error: `Database operation failed: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
    } else {
      // For any other event type, just acknowledge receipt
      console.log(`Received ${event.type} event, no action taken`);
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { ...corsHeaders } }
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
    console.error(err.stack);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders } }
    );
  }
}); 