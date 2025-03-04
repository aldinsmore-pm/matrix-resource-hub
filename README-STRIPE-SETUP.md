# Matrix Resource Hub - Stripe Integration Setup Guide

This guide provides step-by-step instructions for setting up and configuring the Stripe integration for Matrix Resource Hub.

## Prerequisites

Before you begin, make sure you have:

1. A Stripe account with API keys (test or live)
2. Supabase project set up with the Matrix Resource Hub codebase
3. Supabase CLI installed and logged in

## Step 1: Create Database Tables and Functions

First, you need to apply the SQL changes to create the necessary tables and functions:

1. Log in to your Supabase dashboard at [https://app.supabase.com](https://app.supabase.com)
2. Select your project (Matrix Resource Hub)
3. Go to the "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the contents of the `scripts/fix_subscription_function.sql` file:

```sql
-- Create check_subscription function with proper parameters
CREATE OR REPLACE FUNCTION public.check_subscription(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_subscription boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE user_id = uid
        AND status = 'active'
        AND current_period_end > now()
        AND (cancel_at IS NULL OR cancel_at > now())
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$;

-- Grant execution rights to all users
GRANT EXECUTE ON FUNCTION public.check_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.check_subscription(uuid) TO service_role;

-- Create stripe_customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS stripe_customers_user_id_idx ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS stripe_customers_stripe_customer_id_idx ON public.stripe_customers(stripe_customer_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stripe_customers table
CREATE TRIGGER set_stripe_customers_updated_at
BEFORE UPDATE ON public.stripe_customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create handler for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on tables
ALTER TABLE IF EXISTS public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stripe_customers
CREATE POLICY "Users can view their own customer records"
ON public.stripe_customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all customer records"
ON public.stripe_customers FOR ALL
USING (auth.role() = 'service_role');
```

6. Click "Run" to execute the SQL and create the necessary database objects

## Step 2: Deploy Edge Functions

Next, you need to deploy the Supabase Edge Functions that handle subscription management:

```bash
# Navigate to your project directory
cd /path/to/matrix-resource-hub

# Deploy create-stripe-customer function
supabase functions deploy create-stripe-customer --no-verify-jwt

# Deploy manage-subscription function
supabase functions deploy manage-subscription

# Deploy simple-stripe-webhook function
supabase functions deploy simple-stripe-webhook
```

## Step 3: Set Up Stripe Webhook

1. Log in to your Stripe Dashboard at [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to Developers > Webhooks
3. Click "Add endpoint"
4. Enter your webhook URL: `https://bobnfoppduagvvaktebt.supabase.co/functions/v1/simple-stripe-webhook`
5. Select events to subscribe to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. Copy the signing secret (it starts with "whsec_")

## Step 4: Configure Environment Variables

Now you need to set up environment variables for your Edge Functions:

1. Go to your Supabase dashboard at [https://app.supabase.com](https://app.supabase.com)
2. Select your project (Matrix Resource Hub)
3. Go to Settings > API
4. Scroll down to the "Project API keys" section and copy the "service_role" key
5. Go to Settings > Functions
6. For each function (create-stripe-customer, manage-subscription, simple-stripe-webhook), add these environment variables:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
SUPABASE_URL=https://bobnfoppduagvvaktebt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **Note**: The previous setup required a `WEBSITE_URL` and `STRIPE_PRICE_ID` environment variable. These are no longer needed as the application now dynamically passes the return URL from the frontend, making the system work seamlessly across different deployment environments (local, preview, production) without manual configuration changes.

## Step 5: Configure Stripe Customer Portal

1. Go to your Stripe Dashboard at [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to Settings > Customer Portal
3. Configure the following settings:
   - Branding: Add your logo and colors
   - Business information: Add your business name and contact details
   - Products: Select which products customers can manage
   - Features: Enable updating payment methods, cancelling subscriptions, etc.
4. Save your changes

## Step 6: Test the Integration

1. Sign up for a new account in your application
2. Go to the Subscription page
3. Click "Subscribe Now" to be redirected to the Stripe Customer Portal
4. Complete the subscription process
5. Verify that you're redirected back to your application
6. Check that your subscription status is shown correctly

## Troubleshooting

If you encounter issues:

1. Check the Edge Function logs in the Supabase dashboard:
   ```bash
   supabase functions logs simple-stripe-webhook --project-ref bobnfoppduagvvaktebt
   ```
2. Verify that the environment variables are set correctly
3. Ensure the webhook is receiving events (check Stripe dashboard)
4. Test the subscription flow in the Stripe test mode

## Advanced Configuration

For more advanced configurations, such as handling multiple subscription plans or integrating with other payment methods, refer to the Stripe documentation at [https://stripe.com/docs](https://stripe.com/docs). 