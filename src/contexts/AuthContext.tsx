
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile, Subscription } from "../lib/supabase";

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  profile: Profile | null;
  subscription: Subscription | null;
  hasSubscription: boolean;
  signIn: (email: string, password: string) => Promise<any>; // Changed return type to Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>; // Changed return type to Promise<any>
  signOut: () => Promise<void>;
  refreshSession: () => Promise<any>; // Changed return type to Promise<any>
  refreshSubscription: () => Promise<Subscription | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    console.log("AuthContext: Initializing auth state");
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("AuthContext: Error getting session:", sessionError);
          throw sessionError;
        }

        if (sessionData.session) {
          console.log("AuthContext: Found existing session");
          setUser(sessionData.session.user);
          
          // Load profile and subscription data
          await loadUserData(sessionData.session.user.id);
        }
      } catch (error) {
        console.error("AuthContext: Error initializing auth:", error);
        toast.error("Error initializing authentication");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthContext: Auth state changed:", event);
        
        if (event === "SIGNED_IN" && session) {
          console.log("AuthContext: User signed in:", session.user.id);
          setUser(session.user);
          await loadUserData(session.user.id);
        } else if (event === "SIGNED_OUT") {
          // Fixed error: Removed "USER_DELETED" comparison since it's not in the event type
          console.log("AuthContext: User signed out");
          setUser(null);
          setProfile(null);
          setSubscription(null);
        } else if (event === "TOKEN_REFRESHED" && session) {
          console.log("AuthContext: Token refreshed");
          setUser(session.user);
        }
      }
    );
    
    // Initialize auth
    initializeAuth();
    
    // Cleanup
    return () => {
      console.log("AuthContext: Cleaning up");
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Helper function to load user data
  const loadUserData = async (userId: string) => {
    if (!userId) return;
    
    try {
      console.log("AuthContext: Loading user data for user:", userId);
      
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 means not found, which we can handle
        console.error("AuthContext: Error fetching profile:", profileError);
      }
      
      if (profileData) {
        console.log("AuthContext: Profile loaded");
        setProfile(profileData);
      } else {
        // Create minimal profile from user data
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setProfile({
            id: userData.user.id,
            email: userData.user.email || "",
            first_name: null,
            last_name: null,
            avatar_url: null
          });
        }
      }
      
      // Get subscription status
      await refreshSubscription();
      
    } catch (error) {
      console.error("AuthContext: Error loading user data:", error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Signing in user");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success("Successfully signed in");
      
      // User data will be set by the auth listener
      return data;
    } catch (error: any) {
      console.error("AuthContext: Sign in error:", error);
      toast.error(error.message || "Error signing in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Signing up user");
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      toast.success("Successfully signed up");
      
      // User data will be set by the auth listener if autoconfirm is enabled
      // Otherwise we'll show a "check your email" message
      return data;
    } catch (error: any) {
      console.error("AuthContext: Sign up error:", error);
      toast.error(error.message || "Error signing up");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Signing out user");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state (auth listener will also handle this)
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      toast.success("Successfully signed out");
      navigate("/");
    } catch (error: any) {
      console.error("AuthContext: Sign out error:", error);
      toast.error(error.message || "Error signing out");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the session
  const refreshSession = async () => {
    try {
      console.log("AuthContext: Refreshing session");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data.session) {
        setUser(data.session.user);
        await loadUserData(data.session.user.id);
      } else {
        // No session
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
      
      return data.session;
    } catch (error) {
      console.error("AuthContext: Error refreshing session:", error);
      throw error;
    }
  };

  // Refresh subscription status
  const refreshSubscription = async () => {
    try {
      if (!user) return null;
      
      console.log("AuthContext: Checking subscription status");
      
      // First try to use the is_subscribed function for efficiency
      const { data: isSubscribedData, error: isSubscribedError } = await supabase
        .rpc('is_subscribed', { user_uuid: user.id });
      
      if (isSubscribedError) {
        console.error("AuthContext: Error checking is_subscribed:", isSubscribedError);
        // Fall back to direct query
      } else {
        if (!isSubscribedData) {
          console.log("AuthContext: No active subscription found via RPC");
          setSubscription(null);
          return null;
        }
      }
      
      // Either is_subscribed succeeded and returned true, or we're falling back
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        console.error("AuthContext: Error fetching subscription:", subscriptionError);
      }
      
      if (subscriptionData) {
        console.log("AuthContext: Subscription loaded:", subscriptionData.plan);
        setSubscription(subscriptionData);
      } else {
        console.log("AuthContext: No active subscription found");
        setSubscription(null);
      }
      
      return subscriptionData;
    } catch (error) {
      console.error("AuthContext: Error refreshing subscription:", error);
      return null;
    }
  };

  const hasSubscription = subscription !== null && subscription.status === 'active';

  const value = {
    isLoading,
    isAuthenticated: !!user,
    user,
    profile,
    subscription,
    hasSubscription,
    signIn,
    signUp,
    signOut,
    refreshSession,
    refreshSubscription
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
