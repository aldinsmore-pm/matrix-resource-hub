
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Attempting to sign in with:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }
      
      if (data.user) {
        console.log("Login successful for user:", data.user.id);
        toast.success("Login successful");
        
        // Check if user has a subscription
        try {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .single();
            
          if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            console.error("Error checking subscription:", subscriptionError);
          }
          
          console.log("Subscription check result:", subscriptionData ? "Has subscription" : "No subscription");
          
          if (subscriptionData) {
            console.log("User has active subscription, redirecting to dashboard");
            navigate("/dashboard");
          } else {
            console.log("User does not have active subscription, redirecting to payment");
            navigate("/payment");
          }
        } catch (subError: any) {
          console.error("Subscription check failed:", subError);
          // Default to redirecting to payment if we can't verify subscription
          navigate("/payment");
        }
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container p-8 rounded-xl max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Sign In to <span className="text-matrix-primary">Aire</span>
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-matrix-border rounded-md bg-matrix-muted text-white focus:outline-none focus:ring-1 focus:ring-matrix-primary focus:border-matrix-primary"
              placeholder="you@example.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-matrix-border rounded-md bg-matrix-muted text-white focus:outline-none focus:ring-1 focus:ring-matrix-primary focus:border-matrix-primary"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-white focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-matrix-primary focus:ring-matrix-primary border-matrix-border rounded bg-matrix-muted"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
              Remember me
            </label>
          </div>
          <a href="#" className="text-sm text-matrix-primary hover:underline">
            Forgot password?
          </a>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-matrix-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-matrix-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </>
            ) : "Sign in"}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <a href="/signup" className="text-matrix-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
