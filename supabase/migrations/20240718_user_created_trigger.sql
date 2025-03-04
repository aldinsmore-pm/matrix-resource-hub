-- Create a trigger function to call the Edge Function when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger calls the create-stripe-customer Edge Function
  -- The function is called asynchronously via pg_net extension
  PERFORM
    net.http_post(
      url := COALESCE(current_setting('app.supabase_functions_endpoint', true), 'https://bobnfoppduagvvaktebt.supabase.co/functions/v1') || '/create-stripe-customer',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_service_role_key', true), '')
      ),
      body := jsonb_build_object('userId', NEW.id)::text,
      timeout_milliseconds := 10000
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error calling create-stripe-customer function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the pg_net extension is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to fire when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user(); 