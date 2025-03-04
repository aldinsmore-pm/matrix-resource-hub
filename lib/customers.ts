import { stripe } from './stripe';
import { supabase } from './supabase';

// Create or retrieve a Stripe customer for the user
export async function getOrCreateCustomer(userId: string, email: string) {
  // Check if user already has a customer ID in the DB
  const { data: customerData } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (customerData?.stripe_customer_id) {
    return customerData.stripe_customer_id;
  }

  // If not, create a new customer in Stripe
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Store the mapping in Supabase
  await supabase.from('customers').insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}

// Get the user's subscription status
export async function getSubscriptionStatus(userId: string) {
  const { data: customerData } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!customerData?.stripe_customer_id) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerData.stripe_customer_id,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data[0] || null;
} 