-- Script to fix RLS policies and function access one statement at a time
-- Run each statement separately if you encounter errors

-- 1. Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on links table
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- 5. Drop subscription policy if exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.subscriptions;

-- 6. Drop profiles policy if exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 7. Drop resources policy if exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.resources;

-- 8. Drop links policy if exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.links;

-- 9. Create subscriptions policy
CREATE POLICY "Enable read access for all users" ON public.subscriptions
FOR SELECT USING (true);

-- 10. Create profiles policy
CREATE POLICY "Enable read access for all users" ON public.profiles
FOR SELECT USING (true);

-- 11. Create resources policy
CREATE POLICY "Enable read access for all users" ON public.resources
FOR SELECT USING (true);

-- 12. Create links policy
CREATE POLICY "Enable read access for all users" ON public.links
FOR SELECT USING (true);

-- 13. Create subscription check function
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

-- 14. Grant execute on check_subscription function
GRANT EXECUTE ON FUNCTION public.check_subscription TO public;

-- 15. Grant execute on get_top_tags function
GRANT EXECUTE ON FUNCTION public.get_top_tags TO public;

-- 16. Grant execute on set_updated_at function
GRANT EXECUTE ON FUNCTION public.set_updated_at TO public;

-- 17. Grant execute on handle_new_user function
GRANT EXECUTE ON FUNCTION public.handle_new_user TO public;

-- 18. Create test user profile
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, updated_at)
SELECT '62779a66-1de0-405d-a906-ca06fbff867e', 'test@example.com', 'Test', 'User', null, now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = '62779a66-1de0-405d-a906-ca06fbff867e'
);

-- 19. Check permissions
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'anon'
ORDER BY table_name, privilege_type;

-- 20. Check test user subscription
SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e'
    AND status = 'active'
    AND current_period_end > now()
) AS has_active_subscription;

-- 21. Show test user subscription details
SELECT id, user_id, stripe_subscription_id, status, current_period_start, current_period_end
FROM subscriptions
WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e'; 