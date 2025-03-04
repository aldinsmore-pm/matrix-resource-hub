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
    console.log("Create checkout function called");
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service role key available:", !!supabaseKey);
    
    // Check if Stripe secret key is available
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Stripe key available:", !!stripeKey);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body:", body);
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { returnUrl } = body;
    
    if (!returnUrl) {
      console.error("Missing returnUrl in request body");
      return new Response(
        JSON.stringify({ error: "Missing returnUrl in request body" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get the user's session
    const authHeader = req.headers.get("Authorization") || "";
    console.log("Auth header present:", !!authHeader);
    
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get the user
    let userData;
    try {
      userData = await supabase.auth.getUser(token);
      console.log("User data response:", userData);
    } catch (authError) {
      console.error("Auth getUser error:", authError);
      return new Response(
        JSON.stringify({ error: "Auth error", details: authError.message }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const { data: { user }, error: userError } = userData;
    
    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message || "No user found" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Use the provided product ID and price ID
    const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID") || "price_1QydgwRdb4qpGphFz38JIsIL"; // Fallback to provided ID if env var isn't set
    console.log("Using price ID:", PRICE_ID);
    
    console.log(`Creating checkout session for user ${user.id}`);
    
    try {
      // Create Checkout session with the updated price
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl.split("/payment-success")[0]}/payment`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      
      console.log(`Created checkout session: ${session.id}`);
      
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: corsHeaders }
      );
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ error: "Stripe error", details: stripeError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
