import { createClient } from '@supabase/supabase-js';

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userId = process.argv[2] || '62779a66-1de0-405d-a906-ca06fbff867e'; // Default to our test user

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  console.log('Current env values:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubscriptionStatus() {
  console.log('Checking subscription status for user:', userId);

  try {
    // Method 1: Try using the database function
    try {
      console.log('\nMethod 1: Using database function check_subscription:');
      const { data: hasSubData, error: hasSubError } = await supabase
        .rpc('check_subscription', { uid: userId });
        
      if (hasSubError) {
        console.error('Error using database function:', hasSubError);
      } else {
        console.log('Database function result:', hasSubData);
      }
    } catch (functionError) {
      console.error('Exception using database function:', functionError);
    }
    
    // Method 2: Direct query
    console.log('\nMethod 2: Using direct query:');
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (error) {
      console.error('Error with direct query:', error);
    } else {
      console.log('Found', data.length, 'active subscriptions');
      if (data.length > 0) {
        console.log('Subscription details:', JSON.stringify(data[0], null, 2));
        
        // Check if subscription is still valid
        const now = new Date();
        const endDate = new Date(data[0].current_period_end);
        const cancelAt = data[0].cancel_at ? new Date(data[0].cancel_at) : null;
        const isValid = now < endDate && (!cancelAt || now < cancelAt);
        console.log('Subscription still valid?', isValid);
        console.log('- Now:', now.toISOString());
        console.log('- End:', endDate.toISOString());
        if (cancelAt) console.log('- Cancel at:', cancelAt.toISOString());
      }
    }
    
    // Method 3: Simpler query
    console.log('\nMethod 3: Using simplified query:');
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end')
        .eq('user_id', userId);
        
      if (simpleError) {
        console.error('Error with simplified query:', simpleError);
      } else {
        console.log('Found', simpleData.length, 'subscriptions');
        if (simpleData.length > 0) {
          simpleData.forEach(sub => {
            console.log(`Subscription ${sub.id}: status=${sub.status}, ends=${sub.current_period_end}`);
          });
        }
      }
    } catch (simpleQueryError) {
      console.error('Exception with simplified query:', simpleQueryError);
    }
    
    // Check Profile
    console.log('\nChecking if user has a profile:');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error getting profile:', profileError);
      } else if (profileData) {
        console.log('User has a profile:', JSON.stringify(profileData, null, 2));
        // Format name from parts
        if (profileData.first_name || profileData.last_name) {
          console.log('User name:', [profileData.first_name, profileData.last_name].filter(Boolean).join(' '));
        }
      } else {
        console.log('No profile found for user');
      }
    } catch (profileError) {
      console.error('Exception getting profile:', profileError);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSubscriptionStatus(); 