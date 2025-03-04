import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

// Initialize environment variables
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Initialize clients
const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      log('error', 'Missing environment variables');
      throw new Error('Missing environment variables');
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log('error', 'Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Create a Supabase client with the user's JWT
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the user from the JWT
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      log('error', 'Invalid user token', { error: userError });
      throw new Error('Invalid user token');
    }

    log('info', 'User authenticated', { userId: user.id });

    // Parse request body for return URL
    // Default to localhost if no customReturnUrl is provided
    let returnUrl = 'http://localhost:3000';
    try {
      const { customReturnUrl } = await req.json();
      if (customReturnUrl) {
        returnUrl = customReturnUrl;
        log('info', 'Using custom return URL', { returnUrl });
      } else {
        log('info', 'No custom return URL provided, using default', { returnUrl });
      }
    } catch (e) {
      log('warn', 'Failed to parse JSON body, using default return URL', { error: e });
    }

    // Get the customer ID from the stripe_customers table
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError) {
      log('error', 'Error fetching customer', { error: customerError });
      throw new Error(`Error fetching customer: ${customerError.message}`);
    }

    let customerId: string;

    // If customer doesn't exist, create one using the create-stripe-customer function
    if (!customerData) {
      log('info', 'Customer not found, creating new customer');
      
      const createCustomerResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/create-stripe-customer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text();
        log('error', 'Failed to create customer', { 
          status: createCustomerResponse.status, 
          error: errorText 
        });
        throw new Error(`Failed to create customer: ${errorText}`);
      }

      const { customerId: newCustomerId, error } = await createCustomerResponse.json();
      
      if (error || !newCustomerId) {
        log('error', 'Error in customer creation response', { error });
        throw new Error(`Error creating customer: ${error || 'No customer ID returned'}`);
      }

      customerId = newCustomerId;
      log('info', 'New customer created', { customerId });
    } else {
      customerId = customerData.stripe_customer_id;
      log('info', 'Found existing customer', { customerId });
    }

    // Create a Stripe Customer Portal session
    log('info', 'Creating customer portal session', { customerId, returnUrl });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    log('info', 'Customer portal session created', { sessionId: session.id, url: session.url });

    // Return the portal URL
    return new Response(
      JSON.stringify({ url: session.url }),
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