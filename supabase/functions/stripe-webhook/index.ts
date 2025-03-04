import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.11.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Stripe client
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Allow skipping verification for testing - CAUTION: Only enable for testing
const SKIP_VERIFICATION = Deno.env.get("SKIP_WEBHOOK_VERIFICATION") === "true";

// For testing - fallback client reference ID if not present
const FALLBACK_USER_ID = "62779a66-1de0-405d-a906-ca06fbff867e";

// @ts-ignore
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Received webhook request");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", Object.fromEntries([...req.headers.entries()]));
    
    // Get the request body
    const body = await req.text();
    console.log("Webhook body length:", body.length);
    console.log("Webhook body preview:", body.substring(0, 200) + "...");

    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    
    console.log("Stripe signature present:", !!signature);
    if (!signature && !SKIP_VERIFICATION) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the webhook secret
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    // Hardcoded Stripe CLI webhook secret for testing - this matches what Stripe CLI provides
    const stripeCLISecret = "whsec_32ef7bd0f8ccf8c248a983de0713e7e9a41d2a41f9dbd3085864411c23556076";

    console.log("Webhook secret available:", !!webhookSecret);
    console.log("CLI webhook secret available:", !!stripeCLISecret);

    // Verify the signature
    let event;
    
    try {
      if (signature && webhookSecret && !SKIP_VERIFICATION) {
        try {
          console.log("Attempting to verify with configured webhook secret");
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
          console.log("Verified signature with configured webhook secret");
        } catch (configuredSecretError) {
          console.log("Failed to verify with configured secret, trying CLI secret");
          console.log("Error:", configuredSecretError.message);
          // If verification with configured secret fails, try the CLI secret
          try {
            console.log("Attempting to verify with CLI webhook secret");
            event = await stripe.webhooks.constructEventAsync(body, signature, stripeCLISecret);
            console.log("Verified signature with Stripe CLI webhook secret");
          } catch (cliSecretError) {
            // Both secrets failed
            console.log("Failed to verify with CLI secret");
            console.log("Error:", cliSecretError.message);
            throw new Error(`Webhook signature verification failed with both secrets: ${cliSecretError.message}`);
          }
        }
      } else {
        // For testing without a webhook secret or when skipping verification
        console.log("Using webhook payload directly (no signature verification or skipped)");
        
        try {
          event = JSON.parse(body);
          console.log("Successfully parsed body as JSON");
        } catch (parseError) {
          console.error("Failed to parse body as JSON:", parseError.message);
          throw new Error(`Failed to parse webhook body: ${parseError.message}`);
        }
      }
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Event type: ${event.type}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bobnfoppduagvvaktebt.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYm5mb3BwZHVhZ3Z2YWt0ZWJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAyNDEwMywiZXhwIjoyMDU2NjAwMTAzfQ.K8SnUlSLGgZp--XqS5sBnh3gRxX2SfrRnaS3_gXjxhw";
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service role key available:", !!supabaseKey);
    console.log("Service role key first 10 chars:", supabaseKey.substring(0, 10) + "...");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created");

    // Check database connection
    try {
      const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      
      console.log("Database connection test:", error ? "Failed" : "Success");
      console.log("Current subscription count:", count);
      
      if (error) {
        console.error("Database connection error:", error.message);
      }
    } catch (dbError) {
      console.error("Database connection test error:", dbError.message);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      console.log("Handling checkout.session.completed event");
      try {
        const session = event.data.object;
        console.log(`Payment successful for session: ${session.id}`);
        console.log("Complete session data:", JSON.stringify(session));
        
        // Ensure we have a client reference ID (user ID)
        let userId = session.client_reference_id;
        if (!userId) {
          console.log("No client_reference_id found, using fallback:", FALLBACK_USER_ID);
          userId = FALLBACK_USER_ID;
        } else {
          console.log("Using client_reference_id:", userId);
        }
        
        // Retrieve the subscription to get more details
        let subscription;
        try {
          if (session.subscription) {
            subscription = await stripe.subscriptions.retrieve(session.subscription);
            console.log(`Retrieved subscription: ${subscription.id}`);
            console.log("Subscription data:", JSON.stringify(subscription));
          } else {
            console.log("No subscription ID found in session");
          }
        } catch (err) {
          console.error(`Error retrieving subscription: ${err.message}`);
          // Continue without subscription details
        }

        // Try direct insert approach first for reliable testing
        try {
          console.log("Trying direct database insertion...");
          
          // Use a direct insert with simple values
          const currentStart = new Date().toISOString();
          const currentEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          
          const { data: insertData, error: insertError } = await supabase
            .from('subscriptions')
            .insert([
              {
                user_id: userId,
                status: 'active',
                plan: 'matrix_subscription',
                stripe_subscription_id: session.subscription || `manual_sub_${Date.now()}`,
                current_period_start: currentStart,
                current_period_end: currentEnd
              }
            ])
            .select();
            
          if (insertError) {
            console.error("Direct insert error:", insertError.message);
            console.error("Error details:", JSON.stringify(insertError));
            console.log("Falling back to standard process...");
            // Continue with standard process below
          } else {
            console.log("Direct insert successful:", JSON.stringify(insertData));
            return new Response(JSON.stringify({ 
              success: true, 
              message: "Subscription created via direct insert",
              data: insertData
            }), {
              status: 200,
              headers: corsHeaders,
            });
          }
        } catch (directError) {
          console.error("Exception during direct insert:", directError.message);
          console.log("Falling back to standard process...");
          // Continue with standard process below
        }

        // Insert the subscription into the database (standard approach)
        try {
          // Create a base subscription record with minimal required fields
          const subscriptionData: any = {
            user_id: userId,
            status: subscription ? subscription.status : "active",
          };

          // First, check if the subscriptions table exists and has the required columns
          try {
            const { error: schemaError } = await supabase
              .from('subscriptions')
              .select('id')
              .limit(1);
            
            if (schemaError) {
              console.error(`Error checking subscriptions table: ${schemaError.message}`);
              // If the table doesn't exist or has schema issues, we'll create it
              await createSubscriptionsTable(supabase);
            }
          } catch (err) {
            console.error(`Error checking subscriptions table: ${err.message}`);
            // If there's an error, try to create the table
            await createSubscriptionsTable(supabase);
          }

          // Now try to insert with all fields
          subscriptionData.plan = "matrix_subscription";
          subscriptionData.stripe_session_id = session.id;
          subscriptionData.stripe_customer_id = session.customer;
          
          if (subscription) {
            subscriptionData.stripe_subscription_id = subscription.id;
            
            if (subscription.current_period_start && subscription.current_period_end) {
              subscriptionData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
              subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
            }
          }

          console.log("Inserting subscription data:", subscriptionData);

          // Insert the subscription into the database
          const { data, error } = await supabase
            .from("subscriptions")
            .insert([subscriptionData]);

          if (error) {
            console.error(`Error inserting subscription: ${error.message}`);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: corsHeaders,
            });
          }

          console.log("Subscription inserted successfully");
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (err) {
          console.error(`Error processing subscription: ${err.message}`);
          return new Response(JSON.stringify({ error: `Error processing subscription: ${err.message}` }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      } catch (sessionError) {
        console.error("Error processing checkout session:", sessionError.message);
        return new Response(JSON.stringify({ 
          error: `Error processing checkout session: ${sessionError.message}` 
        }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Return a response for other event types
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}, SKIP_VERIFICATION);

// Handler functions for different webhook events

async function handleCheckoutSessionCompleted(session, supabase) {
  console.log('Checkout session completed');
  
  console.log('User ID:', session.client_reference_id);
  console.log('Payment status:', session.payment_status);

  if (!session.client_reference_id) {
    console.error('No client_reference_id (user_id) found in session');
    return;
  }

  if (session.payment_status === 'paid') {
    try {
      // Get subscription details if available
      let subscriptionId = session.subscription;
      let subscriptionDetails = null;
      
      if (subscriptionId) {
        try {
          // If a subscription was created, fetch its details
          console.log('Fetching subscription details for:', subscriptionId);
          subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (err) {
          console.log('Error fetching subscription details, continuing without them:', err.message);
          // Continue without subscription details
        }
      }
      
      // Calculate subscription period dates
      const startDate = new Date().toISOString();
      // Default to 1 year if we can't determine from subscription
      let endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      if (subscriptionDetails && subscriptionDetails.current_period_end) {
        endDate = new Date(subscriptionDetails.current_period_end * 1000).toISOString();
      }
      
      // Determine plan type from the session, product, or default to a standard name
      let planType = 'matrix_subscription';
      if (session.metadata && session.metadata.plan) {
        planType = session.metadata.plan;
      }
      
      // Try to insert subscription record into database
      try {
        // First try with the plan column
        const { data, error } = await supabase
          .from('subscriptions')
          .insert([
            {
              user_id: session.client_reference_id,
              plan: planType,
              status: 'active',
              current_period_start: startDate,
              current_period_end: endDate,
              stripe_session_id: session.id,
              stripe_subscription_id: subscriptionId || null,
            }
          ]);

        if (error) {
          console.error('Error creating subscription record with plan:', error);
          throw error;
        }

        console.log('Successfully created subscription record:', data);
      } catch (err) {
        // If the first attempt fails, try without the plan column
        if (err.message && err.message.includes('plan')) {
          console.log('Trying to insert without plan column');
          const { data, error } = await supabase
            .from('subscriptions')
            .insert([
              {
                user_id: session.client_reference_id,
                status: 'active',
                current_period_start: startDate,
                current_period_end: endDate,
                stripe_session_id: session.id,
                stripe_subscription_id: subscriptionId || null,
              }
            ]);

          if (error) {
            console.error('Error creating subscription record without plan:', error);
            throw error;
          }

          console.log('Successfully created subscription record without plan:', data);
        } else {
          // If it's not a plan-related error, rethrow
          throw err;
        }
      }
    } catch (err) {
      console.error('Error processing checkout.session.completed:', err);
      throw err;
    }
  } else {
    console.log('Payment not confirmed as paid, subscription not created');
  }
}

async function handleSubscriptionCreated(subscription, supabase) {
  console.log('Subscription created:', subscription.id);
  
  try {
    // Check if customer info contains user ID (client_reference_id)
    const customerId = subscription.customer;
    let userId = null;
    
    // Try to get user ID from metadata or look up in existing records
    if (subscription.metadata && subscription.metadata.user_id) {
      userId = subscription.metadata.user_id;
    } else {
      // Look for user ID in existing checkouts or customer data
      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();
      
      if (!error && data) {
        userId = data.user_id;
      }
    }
    
    if (!userId) {
      console.error('Could not determine user_id for subscription:', subscription.id);
      return;
    }
    
    // Insert or update subscription record
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: subscription.items.data[0]?.price?.product || 'matrix_subscription',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
      });

    if (error) {
      console.error('Error creating subscription record:', error);
      throw error;
    }
    
    console.log('Successfully recorded subscription creation');
  } catch (err) {
    console.error('Error processing subscription.created:', err);
    throw err;
  }
}

async function handleSubscriptionUpdated(subscription, supabase) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription record:', error);
      throw error;
    }
    
    console.log('Successfully updated subscription record');
  } catch (err) {
    console.error('Error processing subscription.updated:', err);
    throw err;
  }
}

async function handleSubscriptionDeleted(subscription, supabase) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    // Update subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription record:', error);
      throw error;
    }
    
    console.log('Successfully marked subscription as canceled');
  } catch (err) {
    console.error('Error processing subscription.deleted:', err);
    throw err;
  }
}

async function handleInvoicePaymentSucceeded(invoice, supabase) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // Only process subscription invoices
  if (!invoice.subscription) {
    console.log('Not a subscription invoice, skipping');
    return;
  }
  
  try {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Update subscription period in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating subscription after invoice payment:', error);
      throw error;
    }
    
    console.log('Successfully updated subscription period after payment');
  } catch (err) {
    console.error('Error processing invoice.payment_succeeded:', err);
    throw err;
  }
}

async function handleInvoicePaymentFailed(invoice, supabase) {
  console.log('Invoice payment failed:', invoice.id);
  
  // Only process subscription invoices
  if (!invoice.subscription) {
    console.log('Not a subscription invoice, skipping');
    return;
  }
  
  try {
    // Update subscription status in database to reflect payment issue
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating subscription after payment failure:', error);
      throw error;
    }
    
    console.log('Updated subscription status to past_due after payment failure');
  } catch (err) {
    console.error('Error processing invoice.payment_failed:', err);
    throw err;
  }
}

// Helper function to create the subscriptions table
async function createSubscriptionsTable(supabase) {
  console.log("Creating subscriptions table...");
  
  // SQL to create the subscriptions table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      plan TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_session_id TEXT,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DO $$
    BEGIN
      -- Drop policies if they exist to avoid errors
      DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
      
      -- Create policies
      CREATE POLICY "Users can view their own subscriptions" 
      ON public.subscriptions FOR SELECT 
      USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own subscriptions" 
      ON public.subscriptions FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own subscriptions" 
      ON public.subscriptions FOR UPDATE 
      USING (auth.uid() = user_id);
    END $$;
  `;
  
  try {
    // Execute the SQL using the Supabase client
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error(`Error creating subscriptions table: ${error.message}`);
      throw error;
    }
    
    console.log("Subscriptions table created successfully");
  } catch (err) {
    console.error(`Error executing SQL: ${err.message}`);
    throw err;
  }
}
