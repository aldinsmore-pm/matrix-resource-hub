-- The columns already exist, so let's just check the structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check if there are any active subscriptions for our test user
SELECT 
  id, 
  user_id, 
  status, 
  current_period_start, 
  current_period_end,
  cancel_at,
  canceled_at,
  plan
FROM public.subscriptions
WHERE user_id = '62779a66-1de0-405d-a906-ca06fbff867e';

-- Test the subscription check function directly
SELECT public.check_subscription('62779a66-1de0-405d-a906-ca06fbff867e') AS has_active_subscription; 