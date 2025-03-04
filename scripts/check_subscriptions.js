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

async function checkSubscriptions() {
  console.log('Checking subscriptions table...');
  
  try {
    // First, check the table structure to confirm the plan column exists
    console.log('Checking table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
      
      // Try an alternative approach
      console.log('Trying alternative approach to check structure...');
      
      // Get all subscriptions to see their structure
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);
      
      if (subsError) {
        console.error('Error getting subscriptions:', subsError);
      } else if (subs && subs.length > 0) {
        console.log('Subscription columns:', Object.keys(subs[0]));
        console.log('Plan column exists:', Object.keys(subs[0]).includes('plan'));
      } else {
        console.log('No subscriptions found, structure unclear');
      }
    } else {
      console.log('Subscription table columns:');
      tableInfo.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      const hasPlanColumn = tableInfo.some(col => col.column_name === 'plan');
      console.log('Plan column exists:', hasPlanColumn);
    }
    
    // Now check all subscriptions
    console.log('\nFetching all subscriptions...');
    
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error('Error querying subscriptions:', queryError);
      return;
    }
    
    if (subscriptions.length === 0) {
      console.log('No subscriptions found in the database.');
    } else {
      console.log(`Found ${subscriptions.length} subscriptions.`);
      console.log('\nLatest subscriptions:');
      
      // Display latest 5 subscriptions
      subscriptions.slice(0, 5).forEach((sub, index) => {
        console.log(`\n[${index + 1}] Subscription ID: ${sub.id}`);
        console.log(`- User ID: ${sub.user_id}`);
        console.log(`- Status: ${sub.status}`);
        console.log(`- Plan: ${sub.plan || 'N/A'}`);
        console.log(`- Stripe Customer ID: ${sub.stripe_customer_id || 'N/A'}`);
        console.log(`- Stripe Subscription ID: ${sub.stripe_subscription_id || 'N/A'}`);
        console.log(`- Created At: ${sub.created_at}`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSubscriptions(); 