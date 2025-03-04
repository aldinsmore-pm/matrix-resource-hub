import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.11.0";

// Constants
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Better logging helper
function log(message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    ...(data ? { data } : {}),
  };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only handle POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders },
    });
  }

  try {
    // Get the request body and stripe signature header
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    log("Received webhook request", { 
      method: req.method,
      hasSignature: !!signature
    });

    if (!signature) {
      log("Missing Stripe signature");
      return new Response("Missing signature", { status: 400, headers: corsHeaders });
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Verify and construct the event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      log("Error verifying webhook signature", err);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    log("Supabase client initialized with service role key", { 
      url: SUPABASE_URL?.substring(0, 15) + "..." 
    });

    // Process the webhook event
    log("Processing webhook event", { type: event.type, id: event.id });

    // Variable to store result of operation
    let result: { success: boolean; message: string; received?: boolean } = {
      success: false,
      message: "Unhandled event type",
      received: true
    };

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Processing checkout session", { 
          id: session.id,
          clientReferenceId: session.client_reference_id,
          subscriptionId: session.subscription
        });

        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          return new Response(JSON.stringify({ 
            error: "No user ID in client reference" 
          }), { 
            status: 400,
            headers: corsHeaders
          });
        }

        if (!subscriptionId) {
          return new Response(JSON.stringify({ 
            error: "No subscription ID in session" 
          }), { 
            status: 400,
            headers: corsHeaders
          });
        }

        // Get the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (!subscription) {
          return new Response(JSON.stringify({ 
            error: "Could not retrieve subscription from Stripe" 
          }), { 
            status: 500,
            headers: corsHeaders
          });
        }

        // Create subscription record in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            status: subscription.status,
            plan: "matrix_subscription",
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (error) {
          log("Error creating subscription", error);
          return new Response(JSON.stringify({ 
            error: "Failed to create subscription record" 
          }), { 
            status: 500,
            headers: corsHeaders
          });
        }

        result = {
          success: true,
          message: "Subscription created successfully",
          received: true
        };
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        log("Processing subscription update", { 
          id: subscription.id, 
          status: subscription.status 
        });

        // Get the user ID from metadata
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
          log("No user ID in subscription metadata", subscription.metadata);
          
          // Try to find the subscription record by stripe_subscription_id
          const { data: existingSub, error: findError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
            
          if (findError || !existingSub) {
            log("Could not find existing subscription record", findError);
            return new Response(JSON.stringify({ 
              error: "No user ID in metadata and could not find subscription" 
            }), { 
              status: 400,
              headers: corsHeaders
            });
          }
          
          // Update the existing subscription
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
              cancel_at: subscription.cancel_at 
                ? new Date(subscription.cancel_at * 1000).toISOString() 
                : null,
              canceled_at: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000).toISOString() 
                : null,
            })
            .eq("stripe_subscription_id", subscription.id);
            
          if (updateError) {
            log("Error updating existing subscription", updateError);
            return new Response(JSON.stringify({ 
              error: "Failed to update subscription record" 
            }), { 
              status: 500,
              headers: corsHeaders
            });
          }
          
          result = {
            success: true,
            message: `Subscription updated successfully: ${subscription.id}`,
            received: true
          };
          break;
        }
        
        // Check if a subscription record already exists
        const { data: existingSub, error: findError } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
          
        if (findError && findError.code !== 'PGRST116') {
          log("Error checking for existing subscription", findError);
          return new Response(JSON.stringify({ 
            error: "Failed to check for existing subscription" 
          }), { 
            status: 500,
            headers: corsHeaders
          });
        }
        
        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
              cancel_at: subscription.cancel_at 
                ? new Date(subscription.cancel_at * 1000).toISOString() 
                : null,
              canceled_at: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000).toISOString() 
                : null,
            })
            .eq("id", existingSub.id);
            
          if (updateError) {
            log("Error updating subscription", updateError);
            return new Response(JSON.stringify({ 
              error: "Failed to update subscription record" 
            }), { 
              status: 500,
              headers: corsHeaders
            });
          }
        } else {
          // Create a new subscription record
          const { error: insertError } = await supabase
            .from("subscriptions")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              status: subscription.status,
              plan: "matrix_subscription",
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at: subscription.cancel_at 
                ? new Date(subscription.cancel_at * 1000).toISOString() 
                : null,
              canceled_at: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000).toISOString() 
                : null,
            });
            
          if (insertError) {
            log("Error creating new subscription", insertError);
            return new Response(JSON.stringify({ 
              error: "Failed to create subscription record" 
            }), { 
              status: 500,
              headers: corsHeaders
            });
          }
        }
        
        result = {
          success: true,
          message: `Subscription updated successfully: ${subscription.id}`,
          received: true
        };
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
        result = {
          success: false,
          message: `Unhandled event type: ${event.type}`,
          received: true
        };
    }

    return new Response(JSON.stringify({ received: true, result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    log("Unexpected error processing webhook", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}); 