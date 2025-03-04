import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

// Initialize environment variables
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize clients
const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Helper for structured logging
const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...(data && { data })
  }));
};

serve(async (req) => {
  const timestamp = new Date().toISOString();
  log('info', 'Function invoked', { method: req.method, url: req.url });

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('info', 'Handling OPTIONS request for CORS');
    return new Response('ok', { headers });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    log('error', 'Method not allowed', { method: req.method });
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Validate environment variables
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log('error', 'Missing environment variables');
      throw new Error('Missing environment variables');
    }

    // Parse the request body
    const { userId, createCustomer = true } = await req.json();

    if (!userId) {
      log('error', 'Missing userId in request');
      throw new Error('Missing userId in request');
    }

    log('info', 'Processing request', { userId, createCustomer });

    // Check if the user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      log('error', 'User not found in Supabase', { userId, error: userError });
      throw new Error(`User not found: ${userError?.message || 'No user data'}`);
    }

    // Check if a stripe_customer already exists for this user
    const { data: existingCustomer, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (customerError) {
      log('error', 'Error checking for existing stripe customer', { error: customerError });
      throw new Error(`Error checking for existing customer: ${customerError.message}`);
    }

    // If customer exists and we don't want to create a new one, return the existing customer
    if (existingCustomer && !createCustomer) {
      log('info', 'Using existing Stripe customer', { customerId: existingCustomer.stripe_customer_id });
      return new Response(
        JSON.stringify({ 
          customerId: existingCustomer.stripe_customer_id,
          message: 'Using existing Stripe customer'
        }),
        { status: 200, headers }
      );
    }

    // If customer exists but we want to create a new one anyway (force create)
    if (existingCustomer && createCustomer) {
      log('info', 'Customer exists but force create flag is true. Using existing customer.', { 
        customerId: existingCustomer.stripe_customer_id 
      });
      return new Response(
        JSON.stringify({ 
          customerId: existingCustomer.stripe_customer_id,
          message: 'Using existing Stripe customer (force create ignored)'
        }),
        { status: 200, headers }
      );
    }

    // Create a new Stripe customer
    log('info', 'Creating new Stripe customer', { email: user.email });
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabaseUserId: userId,
      },
    });

    log('info', 'Stripe customer created', { 
      customerId: customer.id, 
      email: customer.email 
    });

    // Store the customer ID in the stripe_customers table
    const { data: insertedCustomer, error: insertError } = await supabaseAdmin
      .from('stripe_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email: user.email,
      })
      .select()
      .single();

    if (insertError) {
      log('error', 'Error inserting customer in database', { error: insertError });
      throw new Error(`Error storing customer: ${insertError.message}`);
    }

    log('info', 'Stripe customer stored in database', { 
      databaseId: insertedCustomer.id,
      customerId: customer.id
    });

    return new Response(
      JSON.stringify({
        customerId: customer.id,
        message: 'Stripe customer created successfully'
      }),
      { status: 200, headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Error processing request', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers }
    );
  }
}); 