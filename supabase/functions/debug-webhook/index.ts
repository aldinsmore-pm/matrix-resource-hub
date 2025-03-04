import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Array to store diagnostic logs
const diagnosticLog: string[] = [];

// Log function with timestamps
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  
  if (data) {
    diagnosticLog.push(`${logMessage} - ${JSON.stringify(data)}`);
    console.log(logMessage, data);
  } else {
    diagnosticLog.push(logMessage);
    console.log(logMessage);
  }
}

serve(async (req) => {
  // Reset diagnostic log for each request
  diagnosticLog.length = 0;
  
  log("Received webhook request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Log environment variables (for debugging)
    log("Environment variables", {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "not set",
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "set (hidden)" : "not set",
      STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY") ? "set (hidden)" : "not set",
      STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET") ? "set (hidden)" : "not set"
    });

    // Log request details
    log("Request method", req.method);
    log("Request headers", Object.fromEntries(req.headers.entries()));
    
    // Get the raw request body
    const body = await req.text();
    log("Raw body length", body.length);
    
    try {
      // Parse the body as JSON
      const data = JSON.parse(body);
      log("Event type", data.type);
      log("Event ID", data.id);
      
      // Create a Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bobnfoppduagvvaktebt.supabase.co";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      log("Creating Supabase client", { supabaseUrl });
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test database connection
      log("Testing database connection");
      const { data: testData, error: testError } = await supabase.from("subscriptions").select("count").limit(1);
      
      if (testError) {
        log("Database connection test failed", testError);
      } else {
        log("Database connection successful", testData);
      }
      
      // Check if we have a checkout.session.completed event
      if (data.type === "checkout.session.completed") {
        const session = data.data.object;
        log("Processing checkout.session.completed", { 
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
          subscriptionId: session.subscription
        });
        
        // Check if we already have a subscription for this Stripe subscription ID
        if (session.subscription) {
          const { data: existingSubscription, error: checkError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", session.subscription)
            .limit(1);
          
          if (checkError) {
            log("Error checking for existing subscription", checkError);
          } else if (existingSubscription.length > 0) {
            log("Subscription already exists for this Stripe subscription ID", { subscriptionId: existingSubscription[0].id });
            return new Response(JSON.stringify({ 
              success: true, 
              message: "Subscription already exists",
              logs: diagnosticLog 
            }), {
              status: 200,
              headers: corsHeaders
            });
          }
        }
        
        // Insert a new subscription
        const now = new Date().toISOString();
        const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        
        const subscriptionData = {
          user_id: session.client_reference_id,
          stripe_subscription_id: session.subscription || `sub_from_session_${session.id}`,
          status: "active",
          plan: "matrix_subscription", 
          current_period_start: now,
          current_period_end: oneYearLater,
          created: now
        };
        
        log("Inserting new subscription", subscriptionData);
        const { data: insertResult, error: insertError } = await supabase
          .from("subscriptions")
          .insert(subscriptionData)
          .select();
        
        if (insertError) {
          log("Error inserting subscription", insertError);
        } else {
          log("Successfully inserted subscription", insertResult);
        }
      } else {
        log("Skipping non-checkout.session.completed event");
      }
      
    } catch (parseError) {
      log("Error parsing request body", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON", 
        logs: diagnosticLog 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Return a success response with diagnostic logs
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Webhook processed successfully",
      logs: diagnosticLog 
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    log("Unexpected error processing webhook", error);
    
    // Return an error response with diagnostic logs
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      message: error.message,
      logs: diagnosticLog 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}); 