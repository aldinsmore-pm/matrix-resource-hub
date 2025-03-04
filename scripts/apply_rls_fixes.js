import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment');
  console.log('Current env values:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'set' : 'not set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'fix_rls_policies.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function main() {
  try {
    console.log('Applying RLS policy fixes...');
    // Execute the SQL
    const { data, error } = await supabase.rpc('pgpsql_exec', { query: sql });
    
    if (error) {
      console.error('Error applying RLS fixes:', error);
      // Try a different approach if the RPC call fails
      try {
        // Break the SQL into separate statements and execute them
        console.log('Trying to execute SQL statements individually...');
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const [index, statement] of statements.entries()) {
          console.log(`Executing statement ${index + 1}/${statements.length}`);
          const { error } = await supabase.rpc('pgpsql_exec', { query: statement });
          if (error) {
            console.error(`Error at statement ${index + 1}:`, error);
            console.log('Statement:', statement);
          }
        }
      } catch (splitError) {
        console.error('Error executing split statements:', splitError);
      }
      return;
    }
    
    console.log('RLS policy fixes applied successfully');
    
    // Now let's check if the subscription check function is working
    const userId = '62779a66-1de0-405d-a906-ca06fbff867e';
    const { data: hasSubData, error: hasSubError } = await supabase
      .rpc('check_subscription', { uid: userId });
      
    console.log('Subscription check result:', hasSubData);
    if (hasSubError) {
      console.error('Error checking subscription:', hasSubError);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main(); 