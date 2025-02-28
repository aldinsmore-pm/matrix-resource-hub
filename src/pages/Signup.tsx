
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SignupForm from "../components/auth/SignupForm";
import { useAuth } from "../contexts/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasSubscription, isLoading } = useAuth();

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
