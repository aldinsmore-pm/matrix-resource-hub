-- Create set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    plan TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$
BEGIN
    -- Check and add 'plan' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscriptions' 
                  AND column_name = 'plan') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan TEXT NOT NULL DEFAULT 'basic';
    END IF;

    -- Check and add 'stripe_session_id' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscriptions' 
                  AND column_name = 'stripe_session_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_session_id TEXT;
    END IF;

    -- Check and add 'stripe_customer_id' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscriptions' 
                  AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id TEXT;
    END IF;

    -- Check and add 'stripe_subscription_id' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscriptions' 
                  AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id TEXT;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Drop policies if they exist to avoid errors
    DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
    DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
    DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
    
    -- Create policies
    CREATE POLICY "Users can view their own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own subscriptions" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own subscriptions" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.uid() = user_id);
END $$;

-- Create subscriptions stripe_customer_id index
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx
    ON public.subscriptions(stripe_customer_id);

-- Create subscriptions stripe_subscription_id index
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
    ON public.subscriptions(stripe_subscription_id);
            
-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 