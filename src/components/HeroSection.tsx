
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Database, Server, Code } from "lucide-react";

const HeroSection = () => {
  const words = ["Enterprise", "Team", "Coworkers", "Colleagues", "Department"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = useRef(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Current word being typed/deleted
      const currentWord = words[currentWordIndex];

      // If deleting, remove one character
      if (isDeleting) {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        typingSpeed.current = 50; // Faster when deleting
      } else {
        // If typing, add one character
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        typingSpeed.current = 100; // Normal speed when typing
      }

      // If finished typing the word
      if (!isDeleting && displayText === currentWord) {
        // Wait a bit at the end of the word
        typingSpeed.current = 1000;
        setIsDeleting(true);
      } 
      // If finished deleting
      else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        // Move to next word in the array
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        typingSpeed.current = 100;
      }

    }, typingSpeed.current);

    return () => clearTimeout(timer);
  }, [displayText, currentWordIndex, isDeleting, words]);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <div className="inline-block mb-4 px-3 py-1 bg-matrix-muted rounded-full border border-matrix-border">
              <span className="text-matrix-primary font-semibold">AI Resources · Guides · Updates</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight animate-fade-in" style={{ animationDelay: "200ms" }}>
            <span className="text-matrix-primary text-glow">Unlock</span> the Power of AI for Your{" "}
            <span className="text-matrix-primary text-glow relative">
              {displayText}
              <span className="absolute -right-1 top-0 h-full w-1 bg-matrix-primary animate-pulse"></span>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl animate-fade-in" style={{ animationDelay: "400ms" }}>
            Access cutting-edge resources, implementation guides, and the latest AI news to empower your company's transformation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
            <a href="#pricing" className="matrix-btn">
              Subscribe Now
            </a>
            <a 
              href="#resources" 
              className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-md text-gray-300 hover:text-white transition-all duration-300"
            >
              Explore Resources
            </a>
          </div>
        </div>

        <div className="mt-20 lg:mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: "800ms" }}>
          <FeatureCard 
            icon={<Database className="w-10 h-10 text-matrix-primary" />}
            title="Latest Resources"
            description="Access our comprehensive library of AI implementation resources, templates, and tools."
          />
          <FeatureCard 
            icon={<Server className="w-10 h-10 text-matrix-secondary" />}
            title="Expert Guides"
            description="Step-by-step guides created by industry experts to implement AI at any scale."
          />
          <FeatureCard 
            icon={<Code className="w-10 h-10 text-matrix-accent" />}
            title="AI News"
            description="Stay updated with the latest advancements, trends, and best practices in AI."
          />
        </div>
      </div>

      <div className="scroll-indicator animate-bounce">
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </div>

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-matrix-bg"></div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="card-container rounded-lg p-6 hover:animate-pulse-glow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default HeroSection;
