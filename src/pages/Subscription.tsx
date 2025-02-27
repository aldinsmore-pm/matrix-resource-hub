
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SubscriptionPage from "../components/subscription/SubscriptionPage";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Subscription = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    
    // Check if user already has a subscription
    const user = JSON.parse(userData);
    if (user.isSubscribed) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-matrix-bg">
      <Navbar />
      <div className="pt-24">
        <SubscriptionPage />
      </div>
      <Footer />
    </div>
  );
};

export default Subscription;
