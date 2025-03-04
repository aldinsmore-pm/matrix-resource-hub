import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bobnfoppduagvvaktebt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

console.log('Creating Supabase client with URL:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectSchema() {
  try {
    console.log('Inspecting database schema for subscriptions table...');

    // Query 1: Use a SQL query to get column information from information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('Error querying subscriptions table:', schemaError);
    } else {
      if (schemaData && schemaData.length > 0) {
        console.log('\n=== SUBSCRIPTIONS TABLE COLUMNS ===');
        const sampleRow = schemaData[0];
        for (const column in sampleRow) {
          console.log(`${column}: ${typeof sampleRow[column]} (Sample value: ${JSON.stringify(sampleRow[column])})`);
        }

        // Check specifically for stripe_session_id
        console.log('\nDoes stripe_session_id exist?', 'stripe_session_id' in sampleRow);
      } else {
        console.log('No data found in subscriptions table - cannot infer schema');
        
        // Try to insert a test row to see what columns are accepted
        console.log('\nAttempting to insert a test row...');
        
        // Create a minimal valid row
        const testRow = {
          user_id: '00000000-0000-0000-0000-000000000000',
          plan: 'test_plan',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([testRow]);
          
        if (insertError) {
          console.error('Insert error:', insertError);
          
          if (insertError.message.includes('foreign key constraint')) {
            console.log('\nError suggests user_id must be a valid user - trying without user_id constraint check');
            
            // Try a SQL query to bypass RLS and constraints for schema inspection only
            const { data, error } = await supabase.rpc('schema_inspector', {
              table_name: 'subscriptions'
            });
            
            if (error) {
              console.error('Schema inspector error:', error);
            } else {
              console.log('Schema details:', data);
            }
          }
        } else {
          console.log('Test row inserted successfully');
          
          // Clean up
          await supabase
            .from('subscriptions')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000');
        }
      }
    }
    
    // Query 2: Execute a raw SQL query to get column information from information_schema
    console.log('\n=== ATTEMPTING RAW SQL QUERY FOR SCHEMA INFO ===');
    try {
      // This may require additional permissions or a custom RPC function
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions'
          ORDER BY ordinal_position;
        `
      });
      
      if (error) {
        console.error('Error executing raw SQL query:', error);
      } else {
        console.log('Schema information from information_schema:');
        console.table(data);
      }
    } catch (err) {
      console.error('Failed to execute raw SQL query:', err);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

inspectSchema(); 