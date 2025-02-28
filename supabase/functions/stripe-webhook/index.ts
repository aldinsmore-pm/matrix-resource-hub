
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.1.1?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  // This is your Stripe CLI webhook secret for testing
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });

  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Webhook secret not set" }),
      { status: 500 }
    );
  }

  // Create a Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400 }
      );
    }

    // Get the request body as text
    const reqBody = await req.text();

    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      reqBody,
      signature,
      webhookSecret
    );

    // Handle the event based on its type
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        if (userId && customerId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          
          // Calculate subscription end date
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          // Update or create subscription in database
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              customer_id: customerId,
              subscription_id: subscriptionId,
              status: subscription.status,
              plan: session.metadata.plan,
              current_period_end: currentPeriodEnd.toISOString(),
            });
            
          if (error) {
            console.error("Error saving subscription:", error);
          }
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Calculate new subscription end date
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        // Update subscription in database
        const { error } = await supabase
          .from("subscriptions")
          .update({ 
            status: subscription.status,
            current_period_end: currentPeriodEnd.toISOString(),
          })
          .eq("subscription_id", subscriptionId);
          
        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Update subscription in database to cancelled
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("subscription_id", subscriptionId);
          
        if (error) {
          console.error("Error cancelling subscription:", error);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400 }
    );
  }
});
