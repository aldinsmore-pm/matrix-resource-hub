import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, hasSubscription } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      console.log("Attempting to sign in with:", { email });
      await signIn(email, password);
      
      toast.success("Login successful");
      
      // Use the subscription status from context to determine redirect
      if (hasSubscription) {
        console.log("User has active subscription, redirecting to dashboard");
        navigate("/dashboard");
      } else {
        console.log("User does not have active subscription, redirecting to payment");
        navigate("/payment");
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="bg-matrix-bg-light p-8 rounded-lg shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-matrix-primary mb-6 text-center">
        Sign In
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-matrix-primary h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-2 border border-matrix-border rounded-md bg-matrix-bg-dark text-matrix-text placeholder-matrix-text-muted focus:outline-none focus:ring-2 focus:ring-matrix-primary"
              disabled={loading}
            />
          </div>
        </div>
        
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-matrix-primary h-5 w-5" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-2 border border-matrix-border rounded-md bg-matrix-bg-dark text-matrix-text placeholder-matrix-text-muted focus:outline-none focus:ring-2 focus:ring-matrix-primary"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-matrix-primary hover:text-matrix-primary-hover"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-matrix-primary text-black py-2 px-4 rounded-md hover:bg-matrix-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-matrix-text-muted">
          Don't have an account?{" "}
          <Link to="/signup" className="text-matrix-primary hover:text-matrix-primary-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
