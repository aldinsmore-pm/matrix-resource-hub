-- Get table schema for subscriptions
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'subscriptions'
ORDER BY
  ordinal_position;

-- Check sample data (limited to 1 row)
SELECT * FROM subscriptions LIMIT 1; 