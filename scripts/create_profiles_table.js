import { createClient } from '@supabase/supabase-js';

// Read the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment');
  console.log('Current environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Set' : 'Not set');
  process.exit(1);
}

// Initialize the Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  try {
    console.log('Checking if profiles table exists...');
    
    // Check if the profiles table exists
    const { error: checkError } = await supabase.from('profiles').select('id').limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Profiles table does not exist. Creating table...');
      
      // We need to use raw SQL, but Supabase JS client doesn't support this directly
      // Let's use Postgres functions to help us
      
      console.log('Creating profiles table with basic structure...');
      
      // First, create the table with basic structure
      const { error: createTableError } = await supabase
        .from('_migrations')
        .insert({
          name: 'create_profiles_table',
          executed_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
      
      if (createTableError && createTableError.code !== '42P01') {
        console.error('Error tracking migration:', createTableError);
      }

      // Since we can't execute raw SQL directly through the JS client,
      // we'll guide the user to do it manually in the Supabase dashboard
      console.log('\n-------------------------------------------------');
      console.log('MANUAL ACTION REQUIRED:');
      console.log('Please run the following SQL in the Supabase SQL Editor:');
      console.log(`
-- Create set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Drop policies if they exist to avoid errors
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    
    -- Create policies
    CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);
    
    -- Add policy for inserting profiles
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
      `);
      console.log('-------------------------------------------------\n');
      
      console.log(`Go to: ${supabaseUrl}/project/sql`);
      console.log('Paste the SQL above and run it to create the profiles table.');
    } else if (checkError) {
      console.error('Error checking profiles table:', checkError);
    } else {
      console.log('Profiles table already exists!');
      
      // Get the number of profiles
      const { data, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      if (countError) {
        console.error('Error getting profiles count:', countError);
      } else {
        console.log(`Found ${data.length} profiles in the table.`);
      }
    }
    
    console.log('Process completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();