
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface PricingTableProps {
  onSubscribe?: (plan: string) => void;
}

const PricingTable = ({ onSubscribe }: PricingTableProps = {}) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    
    checkAuth();
  }, []);

  const handlePricingClick = () => {
    if (onSubscribe) {
      onSubscribe("one-time");
    } else {
      if (isLoggedIn) {
        navigate("/payment");
      } else {
        navigate("/signup");
      }
    }
  };

  return (
    <div className="bg-matrix-bg py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Simple Pricing</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Gain full access to our platform with a one-time payment. No recurring fees.
          </p>
        </div>
        
        <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
          <div className="border border-matrix-border bg-matrix-muted rounded-lg p-8 hover:border-matrix-primary transition-all cursor-pointer"
               onClick={handlePricingClick}>
            <div className="text-center mb-6">
              <div className="font-bold text-2xl mb-2">One-Time Purchase</div>
              <div className="text-5xl font-bold my-4">$99</div>
              <div className="text-gray-400">Lifetime access</div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <div className="text-matrix-primary mr-2">•</div>
                <span>Full access to all AI tools and models</span>
              </li>
              <li className="flex items-start">
                <div className="text-matrix-primary mr-2">•</div>
                <span>Detailed AI implementation guides</span>
              </li>
              <li className="flex items-start">
                <div className="text-matrix-primary mr-2">•</div>
                <span>Regular updates and new features</span>
              </li>
              <li className="flex items-start">
                <div className="text-matrix-primary mr-2">•</div>
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <div className="text-matrix-primary mr-2">•</div>
                <span>No recurring fees</span>
              </li>
            </ul>
            
            <div className="text-center">
              <button
                className="px-8 py-3 bg-matrix-primary text-black font-medium rounded-md hover:bg-opacity-90 transition-colors w-full"
                onClick={handlePricingClick}
              >
                {isLoggedIn ? "Purchase Now" : "Sign Up & Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTable;
