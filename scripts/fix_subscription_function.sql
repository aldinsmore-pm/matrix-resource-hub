-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create the trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_stripe_customers_updated_at'
        AND tgrelid = 'public.stripe_customers'::regclass
    ) THEN
        CREATE TRIGGER set_stripe_customers_updated_at
            BEFORE UPDATE ON public.stripe_customers
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END;
$$;

-- Update the check_subscription function to handle multiple subscriptions
CREATE OR REPLACE FUNCTION public.check_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE user_id = auth.uid()
        AND status = 'active'
        AND current_period_end > NOW()
        -- Get the most recently updated subscription
        ORDER BY updated_at DESC
        LIMIT 1
    );
END;
$$;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION public.check_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription() TO anon;
GRANT EXECUTE ON FUNCTION public.check_subscription() TO service_role;

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