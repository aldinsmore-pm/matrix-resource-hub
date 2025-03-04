import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import ParticleBackground from "../components/ParticleBackground";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, hasSubscription } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect based on subscription status
    if (user) {
      console.log("Login page: User is authenticated, checking subscription");
      if (hasSubscription) {
        console.log("Login page: User has active subscription, redirecting to dashboard");
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from);
      } else {
        console.log("Login page: User does not have active subscription, redirecting to payment");
        navigate("/payment");
      }
    }
  }, [user, hasSubscription, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
      <ParticleBackground opacity={0.5} />
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <LoginForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
