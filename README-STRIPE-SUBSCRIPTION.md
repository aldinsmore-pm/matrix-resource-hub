# Matrix Resource Hub - Stripe Subscription Integration

This document provides instructions for setting up and testing the Stripe subscription integration for Matrix Resource Hub using Stripe Customer Portal and Supabase.

## Overview

This solution simplifies the subscription management process by:
1. Using Stripe Customer Portal for subscription management
2. Creating a 1:1 mapping between Supabase users and Stripe customers
3. Using Supabase Edge Functions to handle the subscription flow
4. Using a simplified webhook handler to update subscription records

## Setup Instructions

### 1. Database Setup

First, deploy the SQL migrations to create the necessary tables and functions:

```bash
# Apply the migrations
supabase db push
```

This will create:
- A `stripe_customers` table mapping Supabase users to Stripe customers
- A trigger to create Stripe customers when new users sign up
- A `check_subscription` RPC function to check if a user has an active subscription

### 2. Deploy Edge Functions

Deploy the Supabase Edge Functions for handling subscriptions:

```bash
# Set up your environment variables first
cp .env.example .env.local
# Edit .env.local with your Stripe and Supabase credentials

# Deploy the functions
supabase functions deploy create-stripe-customer --no-verify-jwt
supabase functions deploy manage-subscription
supabase functions deploy simple-stripe-webhook
```

### 3. Configure Environment Variables

Set the following environment variables in the Supabase dashboard:

| Variable | Description | Where to Set |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Supabase Edge Functions |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Supabase Edge Functions |
| `SUPABASE_URL` | Your Supabase project URL | Supabase Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase Edge Functions |
| `WEBSITE_URL` | Your website URL (for redirects) | Supabase Edge Functions |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Frontend environment |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Frontend environment |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Frontend environment |

### 4. Set Up Stripe Webhooks

In your Stripe dashboard:
1. Go to Developers > Webhooks
2. Add a new endpoint: `https://bobnfoppduagvvaktebt.supabase.co/functions/v1/simple-stripe-webhook`
3. Add the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in your Supabase Edge Functions

### 5. Configure Stripe Customer Portal

In your Stripe dashboard:
1. Go to Settings > Customer Portal
2. Configure the branding and settings as desired
3. Add the products and prices you want to offer
4. Enable the subscription management features you need

## Testing

### 1. Create a Test User

1. Sign up for a new account in the Matrix Resource Hub
2. Verify that a new Stripe customer is created automatically
   - Check the `stripe_customers` table in Supabase
   - Verify the customer exists in Stripe with the Supabase user ID in the metadata

### 2. Test Subscription Flow

1. Log in to the application
2. Go to the Subscription page
3. Click "Subscribe Now"
4. You should be redirected to the Stripe Customer Portal
5. Complete the subscription process
6. After subscribing, you should be redirected back to the application
7. Verify that your subscription status is now active

### 3. Test Webhook

1. After subscribing, check the `subscriptions` table in Supabase
2. Verify that a new record was created with:
   - The correct `user_id`
   - The correct Stripe subscription ID
   - Status set to 'active' or 'trialing'
   - Valid period start and end dates
3. Check the webhook logs to verify event processing:
   ```bash
   supabase functions logs simple-stripe-webhook --project-ref bobnfoppduagvvaktebt
   ```

### 4. Test Subscription Management

1. Go back to the Subscription page
2. Click "Manage Your Subscription"
3. You should be redirected to the Customer Portal
4. Try updating your subscription or changing your payment method
5. Verify that the changes are reflected in the Supabase database

### 5. Test Subscription Cancellation

1. In the Customer Portal, cancel your subscription
2. Verify that the subscription status is updated in the Supabase database
3. Check that the application correctly shows the subscription as being canceled at the end of the period

## Troubleshooting

### Webhook Issues

If webhooks aren't working:
1. Check the Supabase Edge Function logs:
   ```bash
   supabase functions logs simple-stripe-webhook --project-ref bobnfoppduagvvaktebt
   ```
2. Make sure the webhook secret is correct
3. Verify that the webhook events are configured correctly in Stripe
4. Test the webhook manually using the Stripe CLI

### Customer Creation Issues

If customers aren't being created:
1. Check the Supabase triggers and logs
2. Make sure the Edge Function is deployed and has the correct permissions
3. Verify that the Stripe API key is valid

### Subscription Status Issues

If subscription status isn't updating correctly:
1. Check the `check_subscription` function
2. Verify the RLS policies on the `subscriptions` table
3. Check that the webhook is processing events correctly

## Further Improvements

1. Add email notifications for subscription events
2. Implement subscription analytics and reporting
3. Create a dashboard for administrators to manage subscriptions
4. Add support for multiple subscription plans and tiers 