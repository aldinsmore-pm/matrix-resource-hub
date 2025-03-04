-- Create set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the subscriptions table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        CREATE TABLE public.subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            plan TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'trialing', 'past_due')),
            current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
            current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
            stripe_session_id TEXT,
            stripe_subscription_id TEXT,
            stripe_customer_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own subscriptions"
            ON public.subscriptions
            FOR SELECT
            USING (auth.uid() = user_id);

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
            
        RAISE NOTICE 'Created subscriptions table and policies';
    ELSE
        -- Add any columns that might be missing in the existing table
        
        -- Check for stripe_subscription_id column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'stripe_subscription_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id TEXT;
            CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
                ON public.subscriptions(stripe_subscription_id);
            RAISE NOTICE 'Added stripe_subscription_id column';
        END IF;
        
        -- Check for stripe_customer_id column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'stripe_customer_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id TEXT;
            CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx
                ON public.subscriptions(stripe_customer_id);
            RAISE NOTICE 'Added stripe_customer_id column';
        END IF;
        
        -- Check for status column and update constraint if needed
        IF EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscriptions' 
                  AND column_name = 'status') THEN
            -- Drop existing constraint if it doesn't include 'past_due'
            DECLARE
                constraint_name TEXT;
            BEGIN
                SELECT c.conname INTO constraint_name
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE c.conrelid = 'public.subscriptions'::regclass
                AND c.contype = 'c'
                AND n.nspname = 'public'
                AND c.conname LIKE '%status%';
                
                IF FOUND THEN
                    EXECUTE 'ALTER TABLE public.subscriptions DROP CONSTRAINT ' || constraint_name;
                    ALTER TABLE public.subscriptions 
                        ADD CONSTRAINT subscriptions_status_check 
                        CHECK (status IN ('active', 'canceled', 'expired', 'trialing', 'past_due'));
                    RAISE NOTICE 'Updated status column constraint';
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
            END;
        END IF;
        
        RAISE NOTICE 'Subscriptions table already exists';
    END IF;
END
$$; 