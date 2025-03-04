import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = 'https://bobnfoppduagvvaktebt.supabase.co';
const WEBHOOK_URL = SUPABASE_URL + '/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// Use an existing user ID from the database
const EXISTING_USER_ID = '62779a66-1de0-405d-a906-ca06fbff867e';

console.log('Webhook URL:', WEBHOOK_URL);
console.log('Webhook secret available:', !!WEBHOOK_SECRET);

// Generate unique test IDs for this run
const uniqueId = Math.floor(Date.now() / 1000);
const randomStr = Math.random().toString(36).substring(2, 8); // Add random string
const testSubscriptionId = `sub_test_unique_${uniqueId}_${randomStr}`;
const testCustomerId = `cus_test_${uniqueId}`;

console.log(`Creating test subscription update event with ID: ${testSubscriptionId}`);
console.log(`Using existing user ID: ${EXISTING_USER_ID}`);

// Mock subscription with minimal required fields
const mockSubscription = {
  id: testSubscriptionId,
  object: 'subscription',
  customer: testCustomerId,
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  metadata: {
    user_id: EXISTING_USER_ID
  },
  items: {
    data: [
      {
        price: {
          id: 'price_test',
          product: 'prod_test'
        }
      }
    ]
  }
};

// Create a mock subscription.updated event
const mockEvent = {
  id: `evt_${Math.floor(Math.random() * 10000000)}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: mockSubscription
  },
  type: 'customer.subscription.created'
};

// Create a webhook signature
const timestamp = Math.floor(Date.now() / 1000);
const payload = `${timestamp}.${JSON.stringify(mockEvent)}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

// Send the webhook event
console.log('Sending mock event to webhook URL:', WEBHOOK_URL);
console.log('Webhook signature:', `t=${timestamp},v1=${signature}`);

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': `t=${timestamp},v1=${signature}`
  },
  body: JSON.stringify(mockEvent)
})
  .then(response => {
    console.log('Response status:', response.status);
    return response.text();
  })
  .then(body => {
    console.log('Response body:', body);
  })
  .catch(error => {
    console.error('Error sending webhook:', error);
  }); 