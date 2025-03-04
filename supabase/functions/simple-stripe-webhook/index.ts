import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.11.0";

// Constants
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client with service role key (no auth needed)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to log webhook processing
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// CORS headers for preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json"
};

// Main webhook handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST requests for the webhook
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }), 
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get the request body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      log("Missing Stripe signature");
      return new Response(
        JSON.stringify({ error: "Missing signature" }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify and construct the event
    let event: Stripe.Event;
    try {
      // Initialize Stripe without the API key since we're only using it for signature verification
      const stripe = new Stripe("", {
        apiVersion: "2023-10-16",
      });
      
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      log("Error verifying webhook signature", err);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), 
        { status: 400, headers: corsHeaders }
      );
    }

    log("Received Stripe webhook event", { type: event.type, id: event.id });

    // Process different event types
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Processing checkout.session.completed", { 
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
          subscriptionId: session.subscription
        });
        
        // Basic validation
        const userId = session.client_reference_id;
        if (!userId) {
          throw new Error('No client_reference_id found in session');
        }

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          throw new Error('No subscription ID found in session');
        }

        // For testing purposes, we'll construct the subscription data without calling Stripe
        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);
        
        const subscriptionData = {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString(),
          plan: 'matrix_subscription',
          updated_at: now.toISOString()
        };

        // Check for existing subscription for this user
        const { data: existingSubscriptions, error: queryError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId);

        if (queryError) {
          log('Error querying existing subscriptions', queryError);
          throw queryError;
        }

        log('Subscription data prepared', { 
          subscriptionData,
          operation: existingSubscriptions?.length ? 'update' : 'insert'
        });

        let result;
        if (existingSubscriptions && existingSubscriptions.length > 0) {
          // Update existing subscription
          log('Updating existing subscription', { 
            subscriptionId: existingSubscriptions[0].id,
            stripeSubscriptionId: subscriptionId 
          });
          
          const { data, error } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscriptions[0].id)
            .select();

          if (error) {
            log('Error updating subscription', error);
            throw error;
          }
          result = data;
        } else {
          // Create new subscription
          log('Creating new subscription', subscriptionData);
          const { data, error } = await supabase
            .from('subscriptions')
            .insert([subscriptionData])
            .select();

          if (error) {
            log('Error inserting subscription', error);
            throw error;
          }
          result = data;
        }

        log('Successfully processed checkout session', { 
          userId, 
          subscriptionId,
          operation: existingSubscriptions?.length ? 'updated' : 'created'
        });
        
        return new Response(
          JSON.stringify({ 
            received: true, 
            result: { 
              success: true, 
              message: `Subscription ${existingSubscriptions?.length ? 'updated' : 'created'} successfully: ${subscriptionId}`,
              data: result
            } 
          }),
          { status: 200, headers: corsHeaders }
        );
      } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
        const subscription = event.data.object as Stripe.Subscription;
        log(`Processing ${event.type} event`, { subscriptionId: subscription.id });
        
        // Extract the user_id from metadata (if available) or try to find it in the database
        let userId = subscription.metadata?.user_id;
        
        if (!userId) {
          log('No user_id in metadata, trying to find subscription in the database');
          // Try to find the subscription in the database
          const { data, error } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();
          
          if (error || !data) {
            log('Error finding subscription or no matching subscription found', error);
            
            // If no user_id in metadata and no subscription found, we can't proceed
            if (!subscription.metadata?.user_id) {
              return new Response(
                JSON.stringify({ 
                  received: true, 
                  result: { success: false, message: 'No user_id in metadata and subscription not found in the database' } 
                }),
                { status: 404, headers: corsHeaders }
              );
            }
            
            // If we have user_id in metadata but no subscription found, create a new one
            log('Creating new subscription from update event', { 
              user_id: subscription.metadata.user_id,
              subscription_id: subscription.id
            });
            
            // Create basic subscription data
            const now = new Date();
            const subscriptionData = {
              user_id: subscription.metadata.user_id,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              plan: 'matrix_subscription', // Default plan
              updated_at: now.toISOString()
            };
            
            // Insert the new subscription
            const { data: newSubscription, error: insertError } = await supabase
              .from('subscriptions')
              .insert([subscriptionData])
              .select();
            
            if (insertError) {
              log('Error creating new subscription', insertError);
              return new Response(
                JSON.stringify({ 
                  received: true, 
                  result: { success: false, message: `Error creating subscription: ${insertError.message}` } 
                }),
                { status: 500, headers: corsHeaders }
              );
            }
            
            log('New subscription created successfully', { subscriptionId: subscription.id });
            return new Response(
              JSON.stringify({ 
                received: true, 
                result: { 
                  success: true, 
                  message: `New subscription created successfully: ${subscription.id}`,
                  data: newSubscription
                } 
              }),
              { status: 200, headers: corsHeaders }
            );
          }
          
          userId = data.user_id;
          log('Found subscription for user', { userId });
        }
        
        // Prepare update data - only use fields we know exist in the schema
        const updateData = {
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Update the subscription
        log('Updating subscription', { subscriptionId: subscription.id, updateData });
        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          log('Error updating subscription', error);
          return new Response(
            JSON.stringify({ 
              received: true, 
              result: { success: false, message: `Error updating subscription: ${error.message}` } 
            }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        log('Subscription updated successfully', { subscriptionId: subscription.id });
        return new Response(
          JSON.stringify({ 
            received: true, 
            result: { success: true, message: `Subscription updated successfully: ${subscription.id}` } 
          }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        // Handle other event types with a simple response
        log(`Event type ${event.type} not handled by this webhook`);
        return new Response(
          JSON.stringify({ 
            received: true, 
            result: { success: true, message: `Event received but not processed: ${event.type}` } 
          }),
          { status: 200, headers: corsHeaders }
        );
      }
    } catch (err) {
      log(`Error processing webhook event`, err);
      return new Response(
        JSON.stringify({ 
          error: `Error processing webhook: ${err.message}`, 
          details: err.stack 
        }), 
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err) {
    log("Unexpected error", err);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${err.message}` }), 
      { status: 500, headers: corsHeaders }
    );
  }
}); 