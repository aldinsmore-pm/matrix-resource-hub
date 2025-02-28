
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
    
    // Parse request body
    const { returnUrl } = await req.json();
    
    // Get the user's session
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Use the existing product ID and price ID
    const PRODUCT_ID = "prod_Pw7GUW6HPET4KU"; // Your fixed product ID
    const PRICE_ID = "price_1PJ8nJGT8pLZP8l8MGT61mmE"; // Your fixed price ID
    
    console.log(`Creating checkout session for user ${user.id}`);
    
    // Create Checkout session with the fixed price
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
  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
