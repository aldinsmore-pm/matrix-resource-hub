-- Create a function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.check_subscription(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_subscription boolean;
BEGIN
  -- Check if the user has an active subscription that has not expired
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE 
      user_id = uid
      AND status IN ('active', 'trialing')
      AND current_period_end > now()
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$;

-- Grant access to the function for authenticated users
GRANT EXECUTE ON FUNCTION public.check_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription() TO authenticated;