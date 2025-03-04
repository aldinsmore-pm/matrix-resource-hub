-- Fix RLS policies for all tables to ensure proper access

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."resources";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."links";

-- Create RLS policies to allow public access
CREATE POLICY "Enable read access for all users" ON "public"."subscriptions"
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."profiles"
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."resources"
FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."links"
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
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$;

-- Grant access to function
GRANT EXECUTE ON FUNCTION public.check_subscription TO public;
GRANT EXECUTE ON FUNCTION public.get_top_tags TO public;
GRANT EXECUTE ON FUNCTION public.set_updated_at TO public;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO public;

-- Make sure the test user has a profile
INSERT INTO public.profiles (id, email, full_name, avatar_url, website, updated_at)
SELECT '62779a66-1de0-405d-a906-ca06fbff867e', 'test@example.com', 'Test User', null, null, now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = '62779a66-1de0-405d-a906-ca06fbff867e'
);

-- Check table permissions
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'anon'
ORDER BY table_name, privilege_type; 