
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the attempted path for debugging
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Check if this is a direct page refresh/load from browser
    // If it's a direct route that should exist in the app, redirect to root
    // and let React Router handle it
    const isDirectNavigation = !window.performance
      .getEntriesByType("navigation")
      .some((nav) => nav.type === "navigate");

    if (isDirectNavigation && location.pathname !== "/") {
      // Store the attempted path to redirect after initial load
      sessionStorage.setItem("redirectAfterLoad", location.pathname);
      // Redirect to root
      window.location.href = "/";
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-matrix-bg text-white">
      <div className="text-center p-8 bg-matrix-bg-alt/30 border border-matrix-border rounded-lg">
        <h1 className="text-4xl font-bold mb-4 text-matrix-primary">404</h1>
        <p className="text-xl text-gray-300 mb-6">Oops! Page not found</p>
        <a 
          href="/"
          className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-matrix-primary/90 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
