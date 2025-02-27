
import { Check } from "lucide-react";
import { useState } from "react";

interface PricingPlan {
  name: string;
  price: {
    monthly: string;
    annually: string;
  };
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

const PricingTable = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: {
        monthly: "$49",
        annually: "$39",
      },
      description: "Perfect for small teams just beginning their AI journey",
      features: [
        "Access to basic resources",
        "Weekly news updates",
        "Basic implementation guides",
        "5 user accounts",
        "Email support"
      ],
      buttonText: "Get Started"
    },
    {
      name: "Professional",
      price: {
        monthly: "$129",
        annually: "$99",
      },
      description: "Ideal for growing companies ready to fully embrace AI",
      features: [
        "All Starter features",
        "Full resource library access",
        "Daily AI news updates",
        "Advanced implementation guides",
        "20 user accounts",
        "Priority support",
        "Monthly trend reports"
      ],
      highlighted: true,
      buttonText: "Subscribe Now"
    },
    {
      name: "Enterprise",
      price: {
        monthly: "$349",
        annually: "$299",
      },
      description: "Comprehensive solution for large organizations",
      features: [
        "All Professional features",
        "Unlimited user accounts",
        "Custom integration support",
        "Dedicated account manager",
        "Quarterly strategy sessions",
        "White-labeled resource access",
        "Custom AI implementation roadmap"
      ],
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1 rounded-lg bg-matrix-muted border border-matrix-border">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              billingCycle === "monthly"
                ? "bg-matrix-bg text-matrix-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annually")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              billingCycle === "annually"
                ? "bg-matrix-bg text-matrix-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Annually <span className="text-xs text-matrix-secondary">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative card-container rounded-xl overflow-hidden transition-transform hover:-translate-y-2 ${
              plan.highlighted ? "border-matrix-primary animate-pulse-glow" : ""
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-matrix-primary text-black py-1 text-xs font-bold text-center">
                MOST POPULAR
              </div>
            )}
            
            <div className={`p-6 ${plan.highlighted ? "pt-8" : ""}`}>
              <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-matrix-primary">
                  {billingCycle === "monthly" ? plan.price.monthly : plan.price.annually}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>
              
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-matrix-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full py-3 rounded-md font-medium transition-all ${
                  plan.highlighted
                    ? "bg-matrix-primary text-black hover:bg-opacity-90"
                    : "border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingTable;
