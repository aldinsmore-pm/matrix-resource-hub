
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Get the request body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature");
    
    if (!signature) {
      console.error("No Stripe signature found");
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Verify the event came from Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Event received: ${event.type}`);
    
    // Set up Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Handle the specific event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Ensure this is a payment (not a subscription)
      if (session.mode === "payment") {
        const userId = session.metadata.user_id || session.client_reference_id;
        
        if (!userId) {
          console.error("No user ID found in session metadata or client_reference_id");
          return new Response(
            JSON.stringify({ error: "No user ID found" }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        console.log(`Processing payment for user ${userId}`);
        
        // Create a permanent subscription/purchase record
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100); // Set to expire in 100 years (effectively permanent)
        
        const { data, error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan: "Professional",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            stripe_id: session.id,
            payment_status: "paid"
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating subscription record:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create subscription record" }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        console.log(`Successfully created subscription record for user ${userId}`);
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error in webhook handler: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});
