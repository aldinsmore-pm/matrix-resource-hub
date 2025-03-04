-- Fix RLS policies for all tables to ensure proper access

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON "public"."subscriptions";
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."resources";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."links";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."profiles";

-- Create RLS policies with proper restrictions
CREATE POLICY "Users can view own data" ON "public"."subscriptions"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON "public"."profiles"
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.uid() = id);

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

-- Grant access to functions
GRANT EXECUTE ON FUNCTION public.check_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_tags TO public;
GRANT EXECUTE ON FUNCTION public.set_updated_at TO public;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO public;

-- Enable RLS on all tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create or update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (NEW.id, NEW.email, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

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