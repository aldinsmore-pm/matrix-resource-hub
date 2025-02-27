
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ResourceCard from "../components/ResourceCard";
import NewsCard from "../components/NewsCard";
import PricingTable from "../components/PricingTable";
import Footer from "../components/Footer";
import DigitalRain from "../components/DigitalRain";
import { Database, FileText, BrainCircuit, Network, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const resources = [
    {
      title: "AI Implementation Framework",
      description: "A comprehensive framework for implementing AI solutions within enterprise environments.",
      category: "Framework",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "Machine Learning ROI Calculator",
      description: "Calculate the potential return on investment for your machine learning projects.",
      category: "Tool",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "AI Ethics Guidelines",
      description: "Best practices for ensuring ethical implementation of AI systems within your organization.",
      category: "Guide",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "Data Strategy Blueprint",
      description: "A complete guide to developing a data strategy that supports AI initiatives.",
      category: "Blueprint",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "LLM Integration Toolkit",
      description: "Tools and resources for integrating large language models into your products and services.",
      category: "Toolkit",
      image: "https://images.unsplash.com/photo-1655720031554-a929595ffad7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "AI Infrastructure Planning",
      description: "Guidelines for building scalable infrastructure to support AI workloads.",
      category: "Guide",
      image: "https://images.unsplash.com/photo-1496096265110-f83ad7f96608?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    }
  ];

  const news = [
    {
      title: "New Research Shows 73% of Enterprises Struggling with AI Implementation",
      excerpt: "A recent study reveals the challenges that most enterprises face when implementing AI solutions, with insights on how to overcome them.",
      date: "May 15, 2023",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    },
    {
      title: "The Impact of Generative AI on Enterprise Operations",
      excerpt: "Explore how generative AI technologies are transforming business operations across various industries.",
      date: "May 12, 2023",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1465&q=80",
      link: "#"
    },
    {
      title: "Guide: Building an Effective AI Center of Excellence",
      excerpt: "Learn how to establish and grow an AI Center of Excellence to drive innovation throughout your organization.",
      date: "May 8, 2023",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#"
    }
  ];

  const handleSubscribe = (plan: string) => {
    navigate("/signup");
  };

  return (
    <div className={`min-h-screen bg-matrix-bg transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
      <DigitalRain opacity={0.02} density={20} speed={0.6} />
      <Navbar />
      
      <main className="relative z-10">
        <HeroSection />
        
        {/* Resources Section */}
        <section id="resources" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-matrix-primary text-glow">Essential</span> AI Resources
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Access our comprehensive collection of resources designed to help your enterprise implement and leverage AI effectively.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resources.map((resource, index) => (
                <div key={index} style={{ animationDelay: `${(index * 100) + 200}ms` }}>
                  <ResourceCard {...resource} />
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <a 
                href="#" 
                className="inline-flex items-center text-matrix-primary hover:text-matrix-secondary transition-colors"
              >
                <span>View All Resources</span>
                <ArrowUpRight className="ml-1 w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
        
        {/* Guides Section */}
        <section id="guides" className="py-20 bg-matrix-bg-alt">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Implementation <span className="text-matrix-primary text-glow">Guides</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Step-by-step guides for successfully implementing AI technologies in your organization.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:grid-cols-4">
              <GuideCard 
                icon={<Database className="w-12 h-12 text-matrix-primary" />}
                title="Data Infrastructure"
                description="Build robust data infrastructures to power your AI initiatives."
                linkText="Explore Guide"
                link="#"
              />
              <GuideCard 
                icon={<FileText className="w-12 h-12 text-matrix-secondary" />}
                title="AI Strategy"
                description="Develop a comprehensive AI strategy aligned with business objectives."
                linkText="Explore Guide"
                link="#"
              />
              <GuideCard 
                icon={<BrainCircuit className="w-12 h-12 text-matrix-accent" />}
                title="Machine Learning"
                description="Implement machine learning solutions for business processes."
                linkText="Explore Guide"
                link="#"
              />
              <GuideCard 
                icon={<Network className="w-12 h-12 text-matrix-primary" />}
                title="AI Integration"
                description="Integrate AI systems with existing business applications."
                linkText="Explore Guide"
                link="#"
              />
            </div>
          </div>
        </section>
        
        {/* News Section */}
        <section id="news" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Latest AI <span className="text-matrix-primary text-glow">News</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Stay updated with the latest trends, research, and developments in the AI landscape.
              </p>
            </div>
            
            <div className="space-y-8">
              {news.map((item, index) => (
                <div key={index} style={{ animationDelay: `${index * 200}ms` }}>
                  <NewsCard {...item} />
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <a 
                href="#" 
                className="inline-flex items-center text-matrix-primary hover:text-matrix-secondary transition-colors"
              >
                <span>View All News</span>
                <ArrowUpRight className="ml-1 w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-matrix-bg-alt">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Subscription <span className="text-matrix-primary text-glow">Plans</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Choose the plan that best fits your organization's needs and scale as you grow.
              </p>
            </div>
            
            <PricingTable onSubscribe={handleSubscribe} />
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to <span className="text-matrix-primary text-glow">Transform</span> Your Enterprise with AI?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join hundreds of forward-thinking companies that are leveraging our resources to implement AI successfully.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="/signup" className="matrix-btn">
                  Sign Up Now
                </a>
                <a 
                  href="/login" 
                  className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-md text-gray-300 hover:text-white transition-all duration-300"
                >
                  Log In
                </a>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 opacity-50">
            <div className="absolute inset-0 bg-gradient-to-b from-matrix-bg to-transparent"></div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

const GuideCard = ({ 
  icon, 
  title, 
  description, 
  linkText, 
  link 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  link: string;
}) => {
  return (
    <div className="card-container rounded-lg p-6 flex flex-col h-full hover:animate-pulse-glow">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-white text-center">{title}</h3>
      <p className="text-gray-400 text-center mb-6">{description}</p>
      <a 
        href={link} 
        className="matrix-btn text-center mt-auto"
      >
        {linkText}
      </a>
    </div>
  );
};

export default Index;
