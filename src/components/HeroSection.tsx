
import { Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";

const HeroSection = () => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-matrix-bg">
      <ParticleBackground />
      <div className="container mx-auto px-4 z-10 py-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Future of <span className="text-matrix-primary">AI Development</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
              Unlock the potential of AI with our comprehensive and intuitive
              platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link
                to="/payment"
                className="px-6 py-3 rounded-md bg-matrix-primary text-black font-semibold hover:bg-opacity-90 transition-all"
              >
                Get Started
              </Link>
              <Link
                to="/signup"
                className="px-6 py-3 rounded-md border border-matrix-border bg-black bg-opacity-40 hover:bg-opacity-60 transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="/placeholder.svg"
              alt="AI Platform"
              className="w-full max-w-lg mx-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
