
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-matrix-bg flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold mb-4 text-matrix-primary">404</h1>
          <p className="text-xl text-gray-300 mb-4">The page you're looking for doesn't exist</p>
          <p className="text-gray-400 mb-6">
            The path <span className="text-matrix-primary font-mono">{location.pathname}</span> could not be found
          </p>
          <Link 
            to="/" 
            className="matrix-btn inline-block"
          >
            Return to Home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
