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

// Types for the subscription system
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
  stripe_subscription_id?: string;
  price_id?: string;
  quantity?: number;
  cancel_at_period_end?: boolean;
  cancel_at?: string;
  canceled_at?: string;
  ended_at?: string;
};

export type StripeCustomer = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
};

/**
 * Get the user's profile from Supabase
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('getProfile: No authenticated user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Get the user's Stripe customer ID from the stripe_customers table
 */
export async function getStripeCustomer(): Promise<StripeCustomer | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('getStripeCustomer: No authenticated user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching Stripe customer:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error in getStripeCustomer:', error);
    return null;
  }
}

/**
 * Get the user's subscription information 
 */
export async function getSubscription(): Promise<Subscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('getSubscription: No authenticated user found');
      return null;
    }

    // Get the user's active subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error in getSubscription:', error);
    return null;
  }
}

/**
 * Check if the user has an active subscription
 */
export const isSubscribed = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('isSubscribed: No authenticated user found');
      return false;
    }

    // First try: Direct query to subscriptions table
    try {
      console.log('Checking subscription via direct query...');
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .gte('current_period_end', new Date().toISOString())
        .maybeSingle();
      
      if (error) {
        console.warn('Direct query error, will try fallback methods:', error.message);
      } else if (data) {
        console.log('Active subscription found via direct query');
        return true;
      }
    } catch (directQueryError) {
      console.warn('Error in direct subscription query:', directQueryError);
    }

    // Second try: RPC function as fallback
    try {
      console.log('Checking subscription via RPC function...');
      const { data, error } = await supabase.rpc('check_subscription');
      
      if (error) {
        console.warn('RPC function error:', error.message);
      } else {
        console.log('check_subscription RPC result:', data);
        return !!data;
      }
    } catch (rpcError) {
      console.warn('Error calling check_subscription RPC:', rpcError);
    }

    // Last resort: Count any active subscriptions
    console.log('Trying last resort method...');
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (countError) {
      console.error('Failed all subscription check methods:', countError);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Redirect to Stripe Customer Portal for subscription management
 */
export const redirectToCustomerPortal = async (returnUrl?: string): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No authenticated session found');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/manage-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        customReturnUrl: returnUrl || window.location.origin
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error redirecting to customer portal: ${errorData.error || response.statusText}`);
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error redirecting to customer portal:', error);
    return null;
  }
};

/**
 * Create a new subscription (legacy function for compatibility)
 */
export async function createSubscription(plan: string, durationDays: number = 365): Promise<Subscription | null> {
  console.warn('createSubscription is deprecated, use redirectToCustomerPortal instead');
  
  try {
    const portalUrl = await redirectToCustomerPortal();
    if (portalUrl) {
      window.location.href = portalUrl;
    }
    return null;
  } catch (error) {
    console.error('Error in createSubscription:', error);
    return null;
  }
}

/**
 * Create a purchase (legacy function for compatibility)
 */
export async function createPurchase(): Promise<Subscription | null> {
  console.warn('createPurchase is deprecated, use redirectToCustomerPortal instead');
  
  try {
    const portalUrl = await redirectToCustomerPortal();
    if (portalUrl) {
      window.location.href = portalUrl;
    }
    return null;
  } catch (error) {
    console.error('Error in createPurchase:', error);
    return null;
  }
}
