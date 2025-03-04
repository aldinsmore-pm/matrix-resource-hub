-- Ensure Row Level Security is enabled for all relevant tables
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.links ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.resources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.links;

-- Create new RLS policies to allow public access
CREATE POLICY "Enable read access for all users" ON public.subscriptions
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON public.resources
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON public.links
FOR SELECT
USING (true);

-- Create function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.check_subscription(uid UUID)
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

-- Grant access to functions
GRANT EXECUTE ON FUNCTION public.check_subscription TO public;
GRANT EXECUTE ON FUNCTION public.get_top_tags TO public;
GRANT EXECUTE ON FUNCTION public.set_updated_at TO public;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO public;

-- Make sure the test user has a profile
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, updated_at)
SELECT '62779a66-1de0-405d-a906-ca06fbff867e', 'test@example.com', 'Test', 'User', null, now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = '62779a66-1de0-405d-a906-ca06fbff867e'
);

-- Check table permissions to verify changes
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Verify the subscription status for the test user
SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e'
    AND status = 'active'
    AND current_period_end > now()
) AS has_active_subscription;

-- Output subscription details for the test user
SELECT id, user_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at
FROM subscriptions
WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e'; 