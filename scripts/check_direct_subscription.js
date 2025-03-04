import { createClient } from '@supabase/supabase-js';

// Get environment variables
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

const USER_ID = '62779a66-1de0-405d-a906-ca06fbff867e';

async function main() {
  try {
    // 1. Check if the subscriptions table exists
    console.log('Checking if subscriptions table exists...');
    
    const { error: tableCheckError } = await supabase
      .from('subscriptions')
      .select('count(*)', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking subscriptions table:', tableCheckError);
      
      if (tableCheckError.code === '42P01') {
        console.error('The subscriptions table does not exist!');
        process.exit(1);
      }
    } else {
      console.log('Subscriptions table exists');
    }
    
    // 2. Check for the user's subscription directly
    console.log(`Checking if user ${USER_ID} has any subscriptions...`);
    
    const { data: allSubs, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID);
      
    if (allSubsError) {
      console.error('Error checking all subscriptions:', allSubsError);
    } else {
      console.log(`Found ${allSubs.length} subscription(s) for user`);
      if (allSubs.length > 0) {
        console.log('Subscription details:');
        console.table(allSubs);
      }
    }
    
    // 3. Check specifically for active subscriptions
    console.log(`Checking if user ${USER_ID} has active subscriptions...`);
    
    const { data: activeSubs, error: activeSubsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('status', 'active');
      
    if (activeSubsError) {
      console.error('Error checking active subscriptions:', activeSubsError);
    } else {
      console.log(`Found ${activeSubs.length} active subscription(s) for user`);
      if (activeSubs.length > 0) {
        console.log('Active subscription details:');
        console.table(activeSubs);
      } else {
        // Try to figure out why no active subscription is found
        console.log('Subscription status check details:');
        
        if (allSubs.length > 0) {
          const sub = allSubs[0];
          console.log(`- Subscription ID: ${sub.id}`);
          console.log(`- Status: "${sub.status}" (should be "active")`);
          console.log(`- Status type: ${typeof sub.status}`);
          console.log(`- Current period: ${sub.current_period_start} to ${sub.current_period_end}`);
        }
      }
    }
    
    // 4. Try to match exactly what the app is doing
    console.log(`Running the exact same query that the app uses...`);
    
    const { data: appQueryResult, error: appQueryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('status', 'active')
      .maybeSingle();
      
    if (appQueryError) {
      console.error('Error with app query:', appQueryError);
    } else if (!appQueryResult) {
      console.log('App query returned no results, same as in the application');
    } else {
      console.log('App query found a subscription! Details:');
      console.log(appQueryResult);
    }
    
    // 5. Try a manual fix for the subscription if no active one was found
    if (allSubs.length > 0 && activeSubs.length === 0) {
      console.log('Attempting to fix subscription status...');
      
      const { data: updateResult, error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active', 
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', USER_ID)
        .select();
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
      } else {
        console.log('Updated subscription successfully:', updateResult);
      }
    } else if (allSubs.length === 0) {
      console.log('Attempting to create a subscription for the user...');
      
      const { data: insertResult, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: USER_ID,
          status: 'active',
          plan: 'matrix_subscription',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select();
        
      if (insertError) {
        console.error('Error inserting subscription:', insertError);
      } else {
        console.log('Created subscription successfully:', insertResult);
      }
    }
    
    console.log('Process completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main(); 