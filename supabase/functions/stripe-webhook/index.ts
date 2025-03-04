import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@13.11.0";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionCreated
} from './handlers.ts';

// Constants
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to log webhook processing
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Webhook handler function
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
      }
    });
  }

  // Only allow POST requests for the webhook
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Verify environment variables
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    log("Missing required environment variables", {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET
    });
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    // Get the request body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      log("Missing Stripe signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Verify and construct the event
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      log("Error verifying webhook signature", err);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    log("Received Stripe webhook event", { type: event.type, id: event.id });

    // Process different event types
    try {
      let result;
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          log("Processing checkout.session.completed", { 
            sessionId: session.id,
            clientReferenceId: session.client_reference_id,
            subscriptionId: session.subscription
          });
          
          if (!session.subscription) {
            log("No subscription ID in session, cannot process");
            return new Response("No subscription ID in checkout session", { status: 400 });
          }
          
          result = await handleCheckoutSessionCompleted(session, supabase);
          break;
        }
        case "customer.subscription.created": {
          const subscription = event.data.object as Stripe.Subscription;
          log("Processing customer.subscription.created", {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            metadata: subscription.metadata
          });
          result = await handleSubscriptionCreated(subscription, supabase);
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          result = await handleSubscriptionUpdated(subscription, supabase);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          result = await handleSubscriptionDeleted(subscription, supabase);
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          result = await handleInvoicePaid(invoice, supabase);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          result = await handleInvoicePaymentFailed(invoice, supabase);
          break;
        }
        default:
          log("Unhandled event type", { type: event.type });
      }

      return new Response(JSON.stringify({ received: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (processingError) {
      log("Error processing webhook event", processingError);
      // Return a more detailed error message
      return new Response(
        JSON.stringify({
          error: processingError.message,
          details: processingError.stack || "No stack trace available"
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    log("Error processing webhook", error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
}

// Start the server correctly
serve(handler, {
  port: 8000,
  onListen: ({ port, hostname }) => {
    console.log(`Webhook handler listening on ${hostname}:${port}`);
  },
});
