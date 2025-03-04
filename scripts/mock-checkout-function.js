import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Configuration
const WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 
  'https://bobnfoppduagvvaktebt.supabase.co/functions/v1/simple-stripe-webhook';
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