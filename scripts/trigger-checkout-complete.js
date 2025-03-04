import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Constants
const WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://bobnfoppduagvvaktebt.supabase.co/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
const TEST_USER_ID = '62779a66-1de0-405d-a906-ca06fbff867e';

// Create unique test IDs
const subscriptionId = `sub_test_${Math.floor(Date.now() / 1000)}`;
const sessionId = `cs_test_${Math.floor(Date.now() / 1000)}`;

// Create a mock checkout.session.completed event
const event = {
  id: `evt_${Math.random().toString(36).substring(2, 15)}`,
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: sessionId,
      object: 'checkout.session',
      client_reference_id: TEST_USER_ID,
      customer: 'cus_test123456',
      subscription: subscriptionId,
      payment_status: 'paid',
      mode: 'subscription',
      metadata: {
        user_id: TEST_USER_ID
      }
    }
  },
  livemode: false,
  type: 'checkout.session.completed'
};

// Sign the event with webhook secret
const payload = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('hex');

// Prepare the signature header
const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log(`Creating test checkout session with ID: ${sessionId}`);
console.log(`Associated with subscription ID: ${subscriptionId}`);
console.log(`Sending mock checkout.session.completed event to: ${WEBHOOK_URL}`);

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
    console.log(`Webhook response status: ${response.status}`);
    return response.text();
  })
  .then(body => {
    console.log(`Webhook response body: ${body}`);
    console.log('Check your Supabase database for the new subscription entry!');
  })
  .catch(error => {
    console.error('Error sending webhook:', error);
  }); 