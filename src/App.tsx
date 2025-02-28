
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./components/subscription/SubscriptionPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";
import "./App.css";

function App() {
  useEffect(() => {
    // Check if there's a redirect stored from 404 handling
    const redirectPath = sessionStorage.getItem("redirectAfterLoad");
    if (redirectPath) {
      // Clear the redirect to prevent loops
      sessionStorage.removeItem("redirectAfterLoad");
      
      // Get the current path
      const currentPath = window.location.pathname;
      
      // Only redirect if we're on the root path
      if (currentPath === "/") {
        // Use history API to avoid full page reload
        window.history.pushState({}, "", redirectPath);
      }
    }
  }, []);

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute requireSubscription={false}>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
