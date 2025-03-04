import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@13.11.0';

// Helper function to log webhook processing
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  try {
    log('Processing checkout.session.completed', { sessionId: session.id });
    
    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error('No client_reference_id found in session');
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      throw new Error('No subscription ID found in session');
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Fetch subscription details from Stripe
    log('Fetching subscription details from Stripe', { subscriptionId });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Prepare subscription data
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      status: subscription.status,
      plan: 'matrix_subscription', // You might want to get this from product metadata
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
    };

    log('Inserting subscription data', subscriptionData);

    // Insert subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
        returning: 'minimal'
      });

    if (error) {
      log('Error inserting subscription', error);
      throw error;
    }

    log('Successfully processed checkout session', { userId, subscriptionId });
    return data;
  } catch (error) {
    log('Error in handleCheckoutSessionCompleted', error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  try {
    log('Processing subscription update', { subscriptionId: subscription.id });

    // Prepare subscription update data
    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
    };

    log('Updating subscription data', subscriptionData);

    // Update subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
        returning: 'minimal'
      });

    if (error) {
      log('Error updating subscription', error);
      throw error;
    }

    log('Successfully updated subscription', { subscriptionId: subscription.id });
    return data;
  } catch (error) {
    log('Error in handleSubscriptionUpdated', error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  try {
    log('Processing subscription deletion', { subscriptionId: subscription.id });

    // Update subscription record to mark as canceled
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select();

    if (error) {
      log('Error marking subscription as canceled', error);
      throw error;
    }

    log('Successfully marked subscription as canceled', { subscriptionId: subscription.id });
    return data;
  } catch (error) {
    log('Error in handleSubscriptionDeleted', error);
    throw error;
  }
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: any
) {
  try {
    log('Processing invoice.paid', { invoiceId: invoice.id });

    if (!invoice.subscription) {
      log('No subscription associated with invoice', { invoiceId: invoice.id });
      return;
    }

    // Update subscription record to reflect payment
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)
      .select();

    if (error) {
      log('Error updating subscription after payment', error);
      throw error;
    }

    log('Successfully processed invoice payment', { subscriptionId: invoice.subscription });
    return data;
  } catch (error) {
    log('Error in handleInvoicePaid', error);
    throw error;
  }
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  try {
    log('Processing invoice.payment_failed', { invoiceId: invoice.id });

    if (!invoice.subscription) {
      log('No subscription associated with invoice', { invoiceId: invoice.id });
      return;
    }

    // Update subscription record to reflect payment failure
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)
      .select();

    if (error) {
      log('Error updating subscription after payment failure', error);
      throw error;
    }

    log('Successfully processed invoice payment failure', { subscriptionId: invoice.subscription });
    return data;
  } catch (error) {
    log('Error in handleInvoicePaymentFailed', error);
    throw error;
  }
} 