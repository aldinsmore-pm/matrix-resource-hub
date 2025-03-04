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

async function createTestSubscription() {
  console.log('Attempting to create a test subscription...');
  
  try {
    // Check current table schema
    console.log('Getting table info...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');
    
    if (columnsError) {
      console.error('Error getting columns:', columnsError);
    } else {
      console.log('Columns in subscriptions table:', columns.map(c => c.column_name));
    }
    
    // Try to create a test subscription with minimal fields
    console.log('Creating test subscription...');
    
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
      status: 'test',
      // Only include plan if needed
      plan: 'matrix_subscription' 
    };
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('Error creating test subscription:', error);
      
      // If error mentions missing 'plan' column, try to add it
      if (error.message && error.message.includes('plan')) {
        console.log('Looks like the plan column is missing - trying to add it through a migration...');
        
        // Create a migration using Supabase CLI
        console.log('Attempting to create a migration for the plan column...');
        
        // Show the error to the user so they can manually add the column
        console.log('\n===== MANUAL STEPS REQUIRED =====');
        console.log('Please run the following SQL in your Supabase SQL editor:');
        console.log(`
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'matrix_subscription';
        `);
        console.log('==============================\n');
      }
    } else {
      console.log('Test subscription created successfully!');
      console.log('Subscription data:', data);
    }
    
    // Query table after attempt
    const { data: subs, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.error('Error querying subscriptions:', queryError);
    } else {
      console.log('Current subscriptions:', subs);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestSubscription(); 