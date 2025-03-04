import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure the client with options for local development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    // Add custom headers for working with Edge Functions
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    }
  },
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

export async function isSubscribed(): Promise<boolean> {
  try {
    console.log("Checking if user has purchased...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session for purchase check:", sessionError);
      return false;
    }
    
    if (!sessionData.session) {
      console.log("No active session for purchase check");
      return false;
    }
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user for purchase check:", userError);
      return false;
    }
    
    if (!userData.user) {
      console.log("No user found for purchase check");
      return false;
    }
    
    // Try different methods to check for subscription, starting with database function
    console.log("User found, checking purchase status for:", userData.user.id);
    
    try {
      // Method 1: Try using the database function
      const { data: hasSubData, error: hasSubError } = await supabase
        .rpc('check_subscription', { uid: userData.user.id });
        
      if (!hasSubError && hasSubData === true) {
        console.log("Database function confirms active subscription");
        return true;
      }
      
      console.log("Database function check result:", hasSubData, hasSubError);
    } catch (functionError) {
      console.log("Error using database function:", functionError);
      // Continue to next method
    }
    
    // Method 2: Try direct query (original method)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (error) {
      console.error("Error checking purchase status:", error);
      
      // Method 3: Try a simpler query if the original failed (might be permissions issue)
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('subscriptions')
          .select('id, status')
          .eq('user_id', userData.user.id)
          .maybeSingle();
          
        if (!simpleError && simpleData?.status === 'active') {
          console.log("Simple query found active subscription");
          return true;
        }
      } catch (simpleQueryError) {
        console.log("Simple query error:", simpleQueryError);
      }
      
      return false;
    }
    
    if (!data) {
      console.log("No active purchase found");
      return false;
    }
    
    // Check if the subscription is still valid
    const now = new Date();
    const endDate = new Date(data.current_period_end);
    const cancelAt = data.cancel_at ? new Date(data.cancel_at) : null;
    
    if (now > endDate) {
      console.log("Subscription expired");
      return false;
    }
    
    if (cancelAt && now > cancelAt) {
      console.log("Subscription canceled");
      return false;
    }
    
    console.log("Active purchase confirmed");
    return true;
  } catch (error) {
    console.error("isSubscribed error:", error);
    // Return false instead of throwing to handle the case gracefully
    return false;
  }
}

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
