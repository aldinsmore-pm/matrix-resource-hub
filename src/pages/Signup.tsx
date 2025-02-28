
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SignupForm from "../components/auth/SignupForm";
import { useAuth } from "../contexts/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasSubscription, isLoading, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refreshSession();
        setLoading(false);
      } catch (error) {
        console.error("Signup: Error checking auth:", error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [refreshSession]);

  useEffect(() => {
    // If already authenticated, redirect appropriately
    if (!isLoading && isAuthenticated) {
      if (hasSubscription) {
        navigate("/dashboard");
      } else {
        navigate("/subscription");
      }
    }
  }, [isAuthenticated, hasSubscription, isLoading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="flex flex-col items-center">
          <div className="mb-4">Checking session...</div>
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <SignupForm />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Signup;
