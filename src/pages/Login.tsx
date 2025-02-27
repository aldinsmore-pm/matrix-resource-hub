
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginForm from "../components/auth/LoginForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.isSubscribed) {
        navigate("/dashboard");
      } else {
        navigate("/subscription");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-matrix-bg">
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
