-- Add the 'plan' column to the subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'matrix_subscription';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position; 