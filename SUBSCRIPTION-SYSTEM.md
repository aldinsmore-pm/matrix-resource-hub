# Matrix Resource Hub - Subscription System Implementation
This document outlines the steps for implementing the Stripe subscription system.

## Overview

The Matrix Resource Hub subscription system uses Stripe's Customer Portal to provide a seamless subscription management experience. This implementation:

1. Creates a direct mapping between Supabase users and Stripe customers
2. Uses three main Edge Functions:
   - `create-stripe-customer`: Creates a Stripe customer when a user registers
   - `manage-subscription`: Redirects users to the Stripe Customer Portal
   - `simple-stripe-webhook`: Handles subscription events from Stripe

## Key Components

### Database Tables
- `stripe_customers`: Maps Supabase users to Stripe customers
- `subscriptions`: Stores subscription details including status and period dates

### Edge Functions
- `create-stripe-customer`: Automatically creates a Stripe customer for new users
- `manage-subscription`: Generates a Customer Portal session for subscription management
- `simple-stripe-webhook`: Processes Stripe events to update subscription statuses

### Webhook Events
The `simple-stripe-webhook` function handles these Stripe events:
- `customer.subscription.created`: When a subscription is first created
- `customer.subscription.updated`: When a subscription is modified
- `customer.subscription.deleted`: When a subscription is cancelled/deleted
- `invoice.payment_succeeded`: When a payment succeeds (renews subscription)
- `invoice.payment_failed`: When a payment fails (may affect subscription status)

## Implementation Benefits

1. **Better UX**: Users manage subscriptions through Stripe's familiar interface
2. **More Secure**: Uses Stripe's compliant payment system
3. **Lower Maintenance**: Less custom code to maintain
4. **More Reliable**: Multiple fallback methods for checking subscription status
5. **Better Logging**: Enhanced error reporting for easier troubleshooting

## Setup Instructions

For detailed setup instructions, refer to:
- [README-STRIPE-SETUP.md](./README-STRIPE-SETUP.md): Step-by-step setup guide
- [IMPLEMENTATION-STEPS.md](./IMPLEMENTATION-STEPS.md): Detailed implementation steps
- [README-STRIPE-SUBSCRIPTION.md](./README-STRIPE-SUBSCRIPTION.md): Testing and troubleshooting

## Webhook Endpoint

The webhook endpoint is:
```
https://bobnfoppduagvvaktebt.supabase.co/functions/v1/simple-stripe-webhook
```

This endpoint processes all subscription-related events from Stripe and updates the database accordingly.
