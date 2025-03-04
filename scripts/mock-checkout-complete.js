require('dotenv').config();
const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 
  'https://bobnfoppduagvvaktebt.supabase.co/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_kaCX8ZMGrwwrIhT9oKG1glIfzgkT5O24';

// Create a unique test session and subscription ID
const sessionId = 'cs_test_' + Date.now();
const subscriptionId = 'sub_test_' + Date.now();
const customerId = 'cus_test_' + Date.now();
const timestamp = Math.floor(Date.now() / 1000);

// Use a real user ID from the database
const EXISTING_USER_ID = '62779a66-1de0-405d-a906-ca06fbff867e';

console.log('Webhook URL:', WEBHOOK_URL);
console.log('Webhook secret available:', !!WEBHOOK_SECRET);
console.log('Creating test checkout session with ID:', sessionId);
console.log('Associated with subscription ID:', subscriptionId);
console.log('Using existing user ID:', EXISTING_USER_ID);

// Mock what we'll need from Stripe API by overriding Stripe's fetch
// This will intercept the call to retrieve the subscription
global.fetch = async function(url, options) {
  if (url.includes('subscriptions') && url.includes(subscriptionId)) {
    console.log('Intercepting Stripe API call to retrieve subscription:', subscriptionId);
    
    // Return a mock subscription response
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active',
        current_period_start: timestamp,
        current_period_end: timestamp + 365 * 24 * 60 * 60, // 1 year from now
        items: {
          data: [{
            id: 'si_test_' + Date.now(),
            price: {
              id: 'price_test_1',
              product: 'prod_test_1'
            }
          }]
        },
        metadata: {
          user_id: EXISTING_USER_ID
        }
      })
    };
  }
  
  // For all other calls, use the real fetch
  return fetch(url, options);
};

// Create a mock checkout.session.completed event
const mockEvent = {
  id: 'evt_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: timestamp,
  data: {
    object: {
      id: sessionId,
      object: 'checkout.session',
      client_reference_id: EXISTING_USER_ID,
      customer: customerId,
      subscription: subscriptionId,
      payment_status: 'paid',
      status: 'complete',
      mode: 'subscription',
      metadata: {
        plan: 'matrix_subscription'
      }
    }
  },
  type: 'checkout.session.completed',
  livemode: false
};

// Convert event to string
const payload = JSON.stringify(mockEvent);

// Create a signature like Stripe would
const stripeSignature = `t=${timestamp},v1=${crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(`${timestamp}.${payload}`)
  .digest('hex')}`;

console.log('Sending mock event to webhook URL:', WEBHOOK_URL);
console.log('Webhook signature:', stripeSignature);

// Send the webhook event
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': stripeSignature
  },
  body: payload
})
.then(response => {
  console.log(`Response status: ${response.status}`);
  return response.text();
})
.then(body => {
  console.log(`Response body: ${body}`);
})
.catch(error => {
  console.error('Error sending webhook:', error);
}); 