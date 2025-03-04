import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  console.log('Simulating Stripe webhook event with client reference ID');
  
  // Create the event payload
  const payload = {
    id: 'evt_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        client_reference_id: '62779a66-1de0-405d-a906-ca06fbff867e', // The user ID
        customer: 'cus_test_' + Date.now(),
        subscription: 'sub_test_' + Date.now(),
        payment_status: 'paid',
        status: 'complete',
        mode: 'subscription',
        metadata: {
          plan: 'matrix_subscription'
        }
      }
    },
    type: 'checkout.session.completed'
  };
  
  console.log('Webhook payload:', JSON.stringify(payload, null, 2));
  
  // Get the webhook URL from environment or use localhost for testing
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:54321/functions/v1/stripe-webhook';
  console.log('Sending webhook to:', webhookUrl);
  
  try {
    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real webhook, Stripe would sign the payload
        // We're skipping verification for this test
        'Stripe-Signature': 'test_signature'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('Webhook simulation successful!');
    } else {
      console.error('Webhook simulation failed!');
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

main().catch(console.error); 