import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  hasSubscription: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Simplified subscription check using RPC function
  const checkSubscription = async () => {
    try {
      console.log('Checking subscription status...');
      const { data, error } = await supabase.rpc('check_subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return false;
      }
      
      console.log('Subscription check result:', data);
      return !!data;
    } catch (error) {
      console.error('Subscription check failed:', error);
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: number;

    async function initialize() {
      try {
        console.log('Initializing auth state...');
        
        // Set a timeout to prevent infinite loading
        timeoutId = window.setTimeout(() => {
          if (mounted && loading) {
            console.log('Auth initialization timeout reached, forcing ready state');
            setLoading(false);
          }
        }, 5000); // 5 second timeout

        // Get session and set up auth state change listener
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log('Session retrieved:', session ? 'Active' : 'None');
          if (session?.user) {
            setUser(session.user);
            const subscribed = await checkSubscription();
            setHasSubscription(subscribed);
          } else {
            setUser(null);
            setHasSubscription(false);
          }
          setLoading(false);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session ? 'with session' : 'no session');
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              const subscribed = await checkSubscription();
              setHasSubscription(subscribed);
            } else {
              setUser(null);
              setHasSubscription(false);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);
  
  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const subscribed = await checkSubscription();
        setHasSubscription(subscribed);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setLoading(false);
    }
  }
  
  async function signUp(email: string, password: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Error signing up');
      throw error;
    } finally {
      setLoading(false);
    }
  }
  
  async function signOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setHasSubscription(false);
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
      throw error;
    } finally {
      setLoading(false);
    }
  }
  
  const value = {
    user,
    loading,
    hasSubscription,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 