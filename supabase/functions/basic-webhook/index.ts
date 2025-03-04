import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log("Basic webhook received request");
    
    // Log information about the request
    console.log("Method:", req.method);
    console.log("Headers:", JSON.stringify(Object.fromEntries([...req.headers]), null, 2));
    
    // Get request body
    let body;
    try {
      body = await req.text();
      console.log("Body length:", body.length);
      
      // Try to parse as JSON if possible
      try {
        const jsonBody = JSON.parse(body);
        console.log("Parsed JSON body type:", jsonBody.type || "unknown");
        
        // If this is a checkout.session.completed event, try to create a subscription
        if (jsonBody.type === "checkout.session.completed") {
          console.log("Processing checkout.session.completed event");
          
          const session = jsonBody.data.object;
          console.log("Session ID:", session.id);
          console.log("Client Reference ID:", session.client_reference_id);
          console.log("Subscription ID:", session.subscription);
          
          // Use a fallback user ID if client_reference_id is missing
          const userId = session.client_reference_id || "62779a66-1de0-405d-a906-ca06fbff867e";
          
          // Create a Supabase client
          console.log("Initializing Supabase client");
          const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bobnfoppduagvvaktebt.supabase.co";
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYm5mb3BwZHVhZ3Z2YWt0ZWJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAyNDEwMywiZXhwIjoyMDU2NjAwMTAzfQ.K8SnUlSLGgZp--XqS5sBnh3gRxX2SfrRnaS3_gXjxhw";
          
          console.log("Supabase URL:", supabaseUrl);
          console.log("Service role key available:", !!supabaseKey);
          
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Create a basic subscription record
          console.log("Creating subscription record for user:", userId);
          
          const currentDate = new Date();
          const endDate = new Date(currentDate);
          endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
          
          const subscriptionData = {
            user_id: userId,
            stripe_subscription_id: session.subscription || `manual_sub_${Date.now()}`,
            status: "active",
            plan: "matrix_subscription",
            current_period_start: currentDate.toISOString(),
            current_period_end: endDate.toISOString()
          };
          
          console.log("Subscription data:", JSON.stringify(subscriptionData, null, 2));
          
          // Insert the subscription record
          const { data, error } = await supabase
            .from("subscriptions")
            .insert([subscriptionData])
            .select();
            
          if (error) {
            console.error("Error inserting subscription:", error.message);
            console.error("Error details:", JSON.stringify(error, null, 2));
          } else {
            console.log("Successfully created subscription:", JSON.stringify(data, null, 2));
          }
        }
      } catch (jsonError) {
        console.log("Body is not valid JSON:", jsonError.message);
      }
    } catch (bodyError) {
      console.error("Error reading request body:", bodyError.message);
      body = "Could not read body";
    }
    
    // Return a success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Basic webhook processed successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders }
      }
    );
    
  } catch (error) {
    console.error("Webhook error:", error.message);
    
    // Return an error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders }
      }
    );
  }
}); 