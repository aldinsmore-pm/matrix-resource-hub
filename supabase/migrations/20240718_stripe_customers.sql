-- Create stripe_customers table to map Supabase users to Stripe customers
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stripe_customers_user_id_key UNIQUE (user_id),
  CONSTRAINT stripe_customers_stripe_customer_id_key UNIQUE (stripe_customer_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS stripe_customers_user_id_idx ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS stripe_customers_stripe_customer_id_idx ON public.stripe_customers(stripe_customer_id);

-- Enable RLS on the stripe_customers table
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the stripe_customers table
CREATE POLICY "Users can view their own stripe customer" 
ON public.stripe_customers FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_stripe_customers_updated_at
BEFORE UPDATE ON public.stripe_customers
FOR EACH ROW
EXECUTE FUNCTION public.set_stripe_customers_updated_at();

-- NOTE: We won't create the trigger to create a stripe customer here
-- This is better handled by a Supabase Edge Function that has access to the Stripe API
-- We'll create a separate function to handle this 