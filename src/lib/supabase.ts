
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blnaxvnuzikfelwcwzft.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbmF4dm51emlrZmVsd2N3emZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTg4MjEsImV4cCI6MjA1NjI3NDgyMX0.cQHbAQPEdQKqijeNdZ-KIY3U9vCj8gfEk6wNJTtABtw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      // Create a minimal profile if none exists
      if (error.code === 'PGRST116') {
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
  } catch (error) {
    console.error("getProfile error:", error);
    throw error;
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
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user for purchase check:", userError);
      throw userError;
    }
    
    if (!user.user) {
      console.log("No user found for purchase check");
      return false;
    }
    
    console.log("User found, checking purchase status...");
    const { data, error } = await supabase
      .rpc('is_subscribed', { user_uuid: user.user.id });
      
    if (error) {
      console.error("Error checking purchase status:", error);
      throw error;
    }
    
    console.log("Purchase status:", data ? "Active" : "Inactive");
    return data || false;
  } catch (error) {
    console.error("isSubscribed error:", error);
    // Return false instead of throwing to handle the case gracefully
    return false;
  }
}

export async function createPurchase(plan: string): Promise<Subscription | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  // Set end date to never expire (far future date)
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100); // 100 years in the future
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.user.id,
      plan: plan,
      status: 'active',
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
