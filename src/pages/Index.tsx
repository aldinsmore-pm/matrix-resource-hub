
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ResourceCard from "../components/ResourceCard";
import NewsCard from "../components/NewsCard";
import PricingTable from "../components/PricingTable";
import Footer from "../components/Footer";
import { Database, FileText, BrainCircuit, Network, ArrowUpRight, Sparkles, BarChart4 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  published_date: string;
  link: string;
  source?: string;
  // Additional fields for the homepage news display
  excerpt?: string;
  readTime?: string;
  image?: string;
}

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    fetchLatestNews();
  }, []);

  // Fetch news from the NewsAPI Edge Function
  const fetchLatestNews = async () => {
    try {
      setLoadingNews(true);
      
      // Fetch news from our Supabase Edge Function with NewsAPI integration
      const { data, error: functionError } = await supabase.functions.invoke('newsapi');
      
      if (functionError) {
        console.error("Error invoking Edge Function:", functionError);
        throw new Error('Failed to fetch news from Edge Function');
      }
      
      // Check if the response contains data
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Transform data to add the required fields for NewsCard component
        const transformedData = data.data.slice(0, 3).map((item: NewsItem) => ({
          ...item,
          excerpt: `Latest AI developments and updates from ${item.source || 'various sources'}.`,
          readTime: "3 min read",
          image: getNewsImage(item.source || '')
        }));
        
        setLatestNews(transformedData);
        console.log("Successfully fetched news for homepage:", transformedData.length, "items");
      } else {
        console.error("Invalid or empty response from Edge Function:", data);
        throw new Error('Invalid response from Edge Function');
      }
    } catch (error) {
      console.error("Error fetching AI news for homepage:", error);
      toast.error("Failed to load news");
      
      // Fallback to static data if Edge Function fails
      setLatestNews(news);
    } finally {
      setLoadingNews(false);
    }
  };

  // Helper function to get an image based on the news source
  const getNewsImage = (source: string): string => {
    // Default images for common news sources
    const sourceImageMap: Record<string, string> = {
      'OpenAI': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1465&q=80',
      'TechCrunch': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'Wired': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1465&q=80',
      'VentureBeat': 'https://images.unsplash.com/photo-1480694313141-fce5e697ee25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    };
    
    // Return matching image or a default one
    return sourceImageMap[source] || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recent";
    }
  };

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

  // Fallback news data
  const news = [
    {
      id: "1",
      title: "New Research Shows 73% of Enterprises Struggling with AI Implementation",
      excerpt: "A recent study reveals the challenges that most enterprises face when implementing AI solutions, with insights on how to overcome them.",
      date: "May 15, 2023",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#",
      published_date: "2023-05-15T10:00:00Z"
    },
    {
      id: "2",
      title: "The Impact of Generative AI on Enterprise Operations",
      excerpt: "Explore how generative AI technologies are transforming business operations across various industries.",
      date: "May 12, 2023",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1465&q=80",
      link: "#",
      published_date: "2023-05-12T14:30:00Z"
    },
    {
      id: "3",
      title: "Guide: Building an Effective AI Center of Excellence",
      excerpt: "Learn how to establish and grow an AI Center of Excellence to drive innovation throughout your organization.",
      date: "May 8, 2023",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      link: "#",
      published_date: "2023-05-08T09:15:00Z"
    }
  ];

  const handleSubscribe = (plan: string) => {
    navigate("/signup");
  };

  return (
    <div className={`min-h-screen bg-matrix-bg transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
      {/* New Particle background */}
      <ParticleBackground />
      
      <Navbar />
      
      <main className="relative z-10">
        <HeroSection />
        
        {/* Split Layout for Resources and News */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Resources Section (Left side) */}
              <div className="lg:w-7/12">
                <div className="mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="text-matrix-primary text-glow">Essential</span> AI Resources
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Access our collection of resources to help your enterprise implement AI effectively.
                  </p>
                  
                  {/* Featured Resources Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resources.slice(0, 4).map((resource, index) => (
                      <div key={index} className="animate-fade-in" style={{ animationDelay: `${(index * 150)}ms` }}>
                        <ResourceCard {...resource} />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <a 
                      href="#" 
                      className="inline-flex items-center text-matrix-primary hover:text-matrix-secondary transition-colors"
                    >
                      <span>View All Resources</span>
                      <ArrowUpRight className="ml-1 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* News & Updates Section (Right side) */}
              <div className="lg:w-5/12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Latest <span className="text-matrix-primary text-glow">News</span>
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Stay updated with the latest trends and developments in AI.
                  </p>
                  
                  {/* News Feed - Now with dynamic data from NewsAPI */}
                  {loadingNews ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {latestNews.map((item, index) => (
                        <div key={item.id} className="animate-fade-in-right" style={{ animationDelay: `${(index * 200)}ms` }}>
                          <NewsCard 
                            title={item.title}
                            excerpt={item.excerpt || `Latest developments from ${item.source || 'the AI industry'}.`}
                            date={formatDate(item.published_date)}
                            readTime={item.readTime || "3 min read"}
                            image={item.image || getNewsImage(item.source || '')}
                            link={item.link}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 flex justify-center">
                    <a 
                      href="https://newsapi.org" 
                      className="inline-flex items-center text-matrix-primary hover:text-matrix-secondary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Powered by NewsAPI</span>
                      <ArrowUpRight className="ml-1 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-16 bg-matrix-bg-alt relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-matrix-primary/5 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI <span className="text-matrix-primary text-glow">Impact</span> Metrics
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                See how our AI solutions are driving results for enterprises across industries.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard 
                icon={<BarChart4 className="w-8 h-8 text-matrix-primary" />}
                value="73%"
                label="Efficiency Increase"
              />
              <StatCard 
                icon={<Sparkles className="w-8 h-8 text-matrix-secondary" />}
                value="42%"
                label="Cost Reduction"
              />
              <StatCard 
                icon={<BrainCircuit className="w-8 h-8 text-matrix-accent" />}
                value="500+"
                label="AI Models Deployed"
              />
              <StatCard 
                icon={<Database className="w-8 h-8 text-matrix-primary" />}
                value="1.2B+"
                label="Data Points Analyzed"
              />
            </div>
          </div>
        </section>
        
        {/* Guides Section */}
        <section id="guides" className="py-20">
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

// New background component using particles instead of digital rain
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const updateDimensions = () => {
      const { innerWidth, innerHeight } = window;
      setDimensions({ width: innerWidth, height: innerHeight });
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };

    // Initial update
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Particle settings
    const particleCount = 80;
    const particleColor = 'rgba(139, 92, 246, 0.7)'; // Purple color matching matrix-primary
    const connectionColor = 'rgba(139, 92, 246, 0.15)';
    const maxDistance = 250;

    // Create particles
    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Handle boundary collisions
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor.replace('0.7', p.opacity.toString());
        ctx.fill();

        // Draw connections between particles that are close
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            // Opacity based on distance
            const opacity = 1 - distance / maxDistance;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = connectionColor.replace('0.15', (opacity * 0.15).toString());
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      width={dimensions.width}
      height={dimensions.height}
    />
  );
};

// New component for the stats section
const StatCard = ({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode;
  value: string;
  label: string;
}) => {
  return (
    <div className="card-container p-6 rounded-lg flex flex-col items-center text-center animate-scale-up hover:animate-pulse-glow">
      <div className="mb-4">{icon}</div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400">{label}</div>
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
