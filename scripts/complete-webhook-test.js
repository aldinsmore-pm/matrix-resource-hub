import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import crypto from 'crypto';

// Get directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  console.log('Running complete webhook test with production-like payload');
  
  // Create a more realistic checkout.session.completed event
  const userId = '62779a66-1de0-405d-a906-ca06fbff867e'; // The user ID to assign subscription to
  const subscriptionId = 'sub_webhook_test_' + Date.now();
  const timestamp = Math.floor(Date.now() / 1000);
  
  const payload = {
    id: 'evt_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    created: timestamp,
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        client_reference_id: userId,
        customer: 'cus_test_' + Date.now(),
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
  
  console.log('Webhook payload summary:');
  console.log(`- Event Type: ${payload.type}`);
  console.log(`- Client Reference ID: ${payload.data.object.client_reference_id}`);
  console.log(`- Subscription ID: ${payload.data.object.subscription}`);
  
  // Get the webhook URL - use Supabase project URL if available
  // For production, this would be https://bobnfoppduagvvaktebt.supabase.co/functions/v1/stripe-webhook
  const webhookUrl = process.env.SUPABASE_WEBHOOK_URL || 
                     'https://bobnfoppduagvvaktebt.supabase.co/functions/v1/stripe-webhook';
  
  console.log(`\nSending webhook to: ${webhookUrl}`);
  
  // For a proper test, we should sign the payload like Stripe does
  const payload_string = JSON.stringify(payload);
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_kaCX8ZMGrwwrIhT9oKG1glIfzgkT5O24';
  
  // Create a signature like Stripe would
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload_string}`)
    .digest('hex');
  
  const stripe_signature = `t=${timestamp},v1=${signature}`;
  console.log(`Using signature starting with: ${stripe_signature.substring(0, 20)}...`);
  
  try {
    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripe_signature
      },
      body: payload_string
    });
    
    let responseText;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Could not read response';
    }
    
    console.log(`\nResponse status: ${response.status}`);
    console.log(`Response body: ${responseText}`);
    
    if (response.ok) {
      console.log('\nWebhook simulation successful!');
    } else {
      console.error('\nWebhook simulation failed!');
    }
    
    // Check if a subscription was created
    console.log('\nChecking for new subscription...');
    await checkSubscription(userId, subscriptionId);
    
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

async function checkSubscription(userId, subscriptionId) {
  try {
    // Create Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Query for the subscription we just tried to create
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId);
      
    if (error) {
      console.error('Error checking subscription:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Success! Found newly created subscription:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No subscription found with ID:', subscriptionId);
      
      // Check all subscriptions for this user
      const { data: allSubs, error: allSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);
        
      if (allSubsError) {
        console.error('Error checking all subscriptions:', allSubsError);
        return;
      }
      
      console.log(`\nFound ${allSubs.length} total subscriptions for user:`);
      allSubs.forEach(sub => console.log(JSON.stringify(sub, null, 2)));
    }
  } catch (err) {
    console.error('Error in checkSubscription:', err);
  }
}

main().catch(console.error); 