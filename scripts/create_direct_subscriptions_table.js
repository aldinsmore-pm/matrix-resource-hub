import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Setup environment variables
dotenv.config();

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env.local if it exists
const envLocalPath = resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLocalVars = dotenv.parse(envLocalContent);
  for (const [key, value] of Object.entries(envLocalVars)) {
    process.env[key] = value;
  }
}

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`Missing environment variables:
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'defined' : 'missing'}
    SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'defined' : 'missing'}
  `);
  process.exit(1);
}

console.log('Using:');
console.log(`- URL: ${supabaseUrl}`);
console.log(`- Service Role Key: ${supabaseKey.substring(0, 10)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSubscriptionsTable() {
  console.log('Creating subscriptions table...');
  
  const sql = `
    -- Create subscriptions table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'matrix_subscription',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_session_id TEXT,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DO $$
    BEGIN
      -- Drop policies if they exist to avoid errors
      DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
      
      -- Create policies
      CREATE POLICY "Users can view their own subscriptions" 
      ON public.subscriptions FOR SELECT 
      USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own subscriptions" 
      ON public.subscriptions FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own subscriptions" 
      ON public.subscriptions FOR UPDATE 
      USING (auth.uid() = user_id);
    END $$;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON public.subscriptions(stripe_subscription_id);
  `;
  
  try {
    console.log('Executing SQL to create table...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // Try another approach using individual SQL statements
      console.log('Trying alternative approach...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          status TEXT NOT NULL,
          plan TEXT NOT NULL DEFAULT 'matrix_subscription',
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          stripe_session_id TEXT,
          current_period_start TIMESTAMPTZ,
          current_period_end TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('Error creating table with simplified SQL:', createError);
        
        // As a last resort, try to add the missing column to the existing table
        console.log('Trying to add the missing column...');
        const addColumnSQL = `
          ALTER TABLE IF EXISTS public.subscriptions 
          ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'matrix_subscription';
        `;
        
        const { error: alterError } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
        
        if (alterError) {
          console.error('Error adding column:', alterError);
          
          // Check the current table structure
          console.log('Checking current table structure...');
          const { data: tableInfo, error: infoError } = await supabase.rpc('exec_sql', { 
            sql: `SELECT column_name, data_type 
                 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'subscriptions';` 
          });
          
          if (infoError) {
            console.error('Error getting table info:', infoError);
          } else {
            console.log('Table structure:', tableInfo);
          }
        } else {
          console.log('Column added successfully!');
        }
      } else {
        console.log('Table created with simplified SQL!');
      }
    } else {
      console.log('Table created successfully!');
      console.log('Result:', data);
    }
    
    // Query the table to confirm it exists and has the right structure
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.error('Error querying subscriptions table:', queryError);
    } else {
      console.log('Successfully queried subscriptions table!');
      console.log('Sample data:', subscriptions);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createSubscriptionsTable(); 