import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure the client with minimal options for auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

console.log("Supabase client initialized");
console.log("API URL:", supabaseUrl);

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'canceled' | 'expired' | 'trialing';
  current_period_start: string;
  current_period_end: string;
};

export async function getProfile(): Promise<Profile | null> {
  try {
    console.log("Getting current user...");
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      throw userError;
    }
    
    if (!user.user) {
      console.log("No user found");
      return null;
    }
    
    console.log("User found, fetching profile...");
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        // Create a minimal profile if none exists or if there's a table error
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Either no profile exists or the table doesn't exist
          console.log("Creating default profile object since profiles table doesn't exist or profile not found");
          return {
            id: user.user.id,
            email: user.user.email || '',
            first_name: null,
            last_name: null,
            avatar_url: null
          };
        }
        throw error;
      }
      
      console.log("Profile fetched successfully");
      return data;
    } catch (error: any) {
      // Handle the case where the profiles table doesn't exist
      if (error.code === '42P01') { // relation does not exist
        console.log("Profiles table doesn't exist, creating default profile");
        return {
          id: user.user.id,
          email: user.user.email || '',
          first_name: null,
          last_name: null,
          avatar_url: null
        };
      }
      throw error;
    }
  } catch (error) {
    console.error("getProfile error:", error);
    // Return a basic profile instead of throwing to avoid breaking the dashboard
    return {
      id: 'unknown',
      email: 'unknown',
      first_name: null,
      last_name: null,
      avatar_url: null
    };
  }
}

export async function getSubscription(): Promise<Subscription | null> {
  try {
    console.log("Getting current user for purchase verification...");
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user for purchase verification:", userError);
      throw userError;
    }
    
    if (!user.user) {
      console.log("No user found for purchase verification");
      return null;
    }
    
    console.log("User found, checking purchase status...");
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .single();
      
    if (error) {
      // If no purchase found, return null
      if (error.code === 'PGRST116') {
        console.log("No active purchase found");
        return null;
      }
      console.error("Error checking purchase status:", error);
      throw error;
    }
    
    console.log("Purchase verification successful");
    return data;
  } catch (error) {
    console.error("getSubscription error:", error);
    // Return null instead of throwing to handle the case gracefully
    return null;
  }
}

export const isSubscribed = async (): Promise<boolean> => {
  try {
    console.log("isSubscribed: Checking subscription status...");
    
    // First, get the current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("isSubscribed: Error getting user:", userError);
      return false;
    }
    
    if (!user.user) {
      console.log("isSubscribed: No authenticated user found");
      return false;
    }
    
    // Debug header value
    console.log("isSubscribed: Using Accept header:", "application/json");
    
    // Method 1: Try direct query first
    try {
      const { data, error, status } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      console.log(`isSubscribed: Query response - Status: ${status}, Error: ${error ? JSON.stringify(error) : 'None'}`);
      
      if (!error) {
        const hasActiveSubscription = !!data;
        console.log(`isSubscribed: Active subscription found: ${hasActiveSubscription}`, data ? `ID: ${data.id}` : '');
        return hasActiveSubscription;
      }
      
      // If we got an error, but not a 'not found' error, try the fallback
      console.error('isSubscribed: Error checking subscription status:', error);
      
      // Add specific debugging for 406 errors and other cases
      if (status === 406) {
        console.error('isSubscribed: Received 406 Not Acceptable error. This may indicate a header or content negotiation issue.');
        console.error('isSubscribed: Request headers may be inconsistent with server expectations.');
      }
    } catch (queryError) {
      console.error('isSubscribed: Error in direct query:', queryError);
    }
    
    // Method 2: Fall back to RPC function which is more reliable and has proper security checks
    console.log('isSubscribed: Attempting fallback using check_subscription RPC function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'check_subscription', 
      { uid: user.user.id }
    );
    
    if (rpcError) {
      console.error('isSubscribed: Fallback RPC failed:', rpcError);
      
      // Method 3: Last resort - check if any subscription exists for this user
      try {
        const { data: anySubData, error: anySubError } = await supabase
          .from('subscriptions')
          .select('id, status')
          .eq('user_id', user.user.id)
          .eq('status', 'active')
          .limit(1);
          
        if (!anySubError && anySubData && anySubData.length > 0) {
          console.log('isSubscribed: Found active subscription through basic query');
          return true;
        }
      } catch (lastError) {
        console.error('isSubscribed: All methods failed:', lastError);
      }
      
      return false;
    }
    
    console.log('isSubscribed: Fallback RPC result:', rpcData);
    return !!rpcData;
  } catch (e) {
    console.error('isSubscribed: Unexpected error checking subscription:', e);
    return false;
  }
};

export async function createSubscription(plan: string, durationDays: number = 365): Promise<Subscription | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  // Set end date based on duration parameter
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.user.id,
      plan: plan,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: endDate.toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating subscription record:', error);
    return null;
  }
  
  return data;
}

export async function createPurchase(): Promise<Subscription | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  // Set end date to never expire (far future date)
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100); // 100 years in the future
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.user.id,
      plan: "Professional",
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: endDate.toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating purchase record:', error);
    return null;
  }
  
  return data;
}
