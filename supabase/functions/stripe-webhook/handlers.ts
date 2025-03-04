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

    // Check for existing subscription for this user
    const { data: existingSubscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (queryError) {
      log('Error querying existing subscriptions', queryError);
      throw queryError;
    }

    // Match exact schema fields from the database
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan: 'matrix_subscription',
      updated_at: new Date().toISOString()
    };

    // Log the database operation we're about to perform
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
    return result;
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
        return { success: false, message: 'Subscription not found in the database' };
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
      return { success: false, message: `Error updating subscription: ${error.message}` };
    }
    
    log('Subscription updated successfully', { subscriptionId: subscription.id });
    return { success: true, message: `Subscription updated successfully: ${subscription.id}` };
  } catch (error) {
    log('Error in handleSubscriptionUpdated', error);
    return { success: false, message: `Error processing subscription update: ${error}` };
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
        ended_at: new Date().toISOString(),
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

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabaseAdmin: any
): Promise<{ success: boolean; message: string }> {
  try {
    log('Processing subscription created event', { id: subscription.id });
    
    // Extract user ID from metadata or from an existing subscription
    let userId = subscription.metadata?.user_id;
    
    if (!userId) {
      log('No user_id in metadata, searching in existing subscriptions');
      
      // Try to find the user ID from existing subscriptions with this customer ID
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      if (error) {
        log('No existing subscription found', error);
      } else if (data) {
        userId = data.user_id;
        log('Found user_id from existing subscription', { userId });
      }
    }
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Could not determine user_id for subscription' 
      };
    }
    
    // Prepare subscription data matching the exact database schema
    const subscriptionData = {
      user_id: userId,
      plan: 'matrix_subscription',
      status: subscription.status,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
    
    log('Inserting subscription data', subscriptionData);
    
    // Upsert the subscription data
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert([subscriptionData])
      .select();
      
    if (error) {
      log('Error inserting subscription', error);
      return {
        success: false,
        message: `Failed to insert subscription: ${error.message}`
      };
    }
    
    log('Successfully processed subscription creation', data);
    return {
      success: true,
      message: 'Subscription created successfully'
    };
    
  } catch (err) {
    log('Unexpected error in handleSubscriptionCreated', err);
    return {
      success: false,
      message: `Error processing subscription: ${err.message}`
    };
  }
} 