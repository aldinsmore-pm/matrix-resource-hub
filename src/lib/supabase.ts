
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
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();
    
  return data;
}

export async function getSubscription(): Promise<Subscription | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('status', 'active')
    .single();
    
  return data;
}

export async function isSubscribed(): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return false;
  
  const { data } = await supabase
    .rpc('is_subscribed', { user_uuid: user.user.id });
    
  return data || false;
}

export async function createSubscription(plan: string, durationDays: number = 30): Promise<Subscription | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  // Calculate end date based on duration
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  
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
    console.error('Error creating subscription:', error);
    return null;
  }
  
  return data;
}
