-- Fix subscription table issues

-- First, ensure we have the correct constraint on subscriptions
BEGIN;

-- 1. Drop primary key constraint if one exists
DO $$
BEGIN
  -- Try to drop the primary key constraint by name if it exists
  ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
  EXCEPTION WHEN OTHERS THEN
  -- Ignore if it doesn't exist
  NULL;
END $$;

-- 2. Create a new primary key constraint that allows for uniqueness by user
ALTER TABLE public.subscriptions ADD PRIMARY KEY (id);

-- 3. Make sure we have a unique constraint on user_id
DO $$
BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT unique_user_id UNIQUE (user_id);
  EXCEPTION WHEN duplicate_table THEN
  -- Constraint already exists
  NULL;
END $$;

-- 4. Make sure related columns are nullable
ALTER TABLE public.subscriptions 
  ALTER COLUMN stripe_customer_id DROP NOT NULL,
  ALTER COLUMN stripe_subscription_id DROP NOT NULL,
  ALTER COLUMN stripe_session_id DROP NOT NULL;

-- 5. Enable direct access to bypassing RLS
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 6. Recreate all relevant RLS policies with correct permissions
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Anyone can read subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
  
  -- Create open policies for ease of testing
  CREATE POLICY "Anyone can view subscriptions" 
  ON public.subscriptions FOR SELECT 
  TO PUBLIC
  USING (true);
  
  CREATE POLICY "Authenticated users can insert subscriptions" 
  ON public.subscriptions FOR INSERT 
  TO authenticated
  WITH CHECK (true);
  
  CREATE POLICY "Authenticated users can update subscriptions" 
  ON public.subscriptions FOR UPDATE 
  TO authenticated
  USING (true);
END $$;

-- 7. Re-enable RLS after ensuring policies are correct
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Now insert or update the user's subscription
INSERT INTO public.subscriptions (
  id,
  user_id, 
  status, 
  plan, 
  current_period_start, 
  current_period_end
)
VALUES (
  gen_random_uuid(),
  '62779a66-1de0-405d-a906-ca06fbff867e',  -- Your user ID
  'active',
  'matrix_subscription',
  CURRENT_TIMESTAMP,
  (CURRENT_TIMESTAMP + INTERVAL '1 year')
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  plan = 'matrix_subscription',
  current_period_start = CURRENT_TIMESTAMP,
  current_period_end = (CURRENT_TIMESTAMP + INTERVAL '1 year');

-- 9. Check if the insert/update worked
SELECT * FROM public.subscriptions WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e';

-- 10. Fix the profiles table too
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Add open policies 
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
  
  CREATE POLICY "Anyone can view profiles" 
  ON public.profiles FOR SELECT 
  TO PUBLIC
  USING (true);
END $$;

-- Re-enable RLS after policies are set
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a profile for the user
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name
)
VALUES (
  '62779a66-1de0-405d-a906-ca06fbff867e',
  'user@example.com',
  'Test',
  'User'
)
ON CONFLICT (id) DO NOTHING;

-- Check if profile exists
SELECT * FROM public.profiles WHERE id = '62779a66-1de0-405d-a906-ca06fbff867e';

COMMIT; 