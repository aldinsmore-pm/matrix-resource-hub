import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payment from "./pages/Payment";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, hasSubscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!hasSubscription) {
    console.log("ProtectedRoute: No active subscription, redirecting to payment page");
    return <Navigate to="/payment" replace />;
  }

  return children;
};

const App = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matrix-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-matrix-primary">Loading app...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/subscription" element={<Navigate to="/payment" replace />} />
        
        {/* New routes for navigation */}
        <Route path="/resources" element={<Navigate to="/#resources" replace />} />
        <Route path="/news" element={<Navigate to="/#news" replace />} />
        <Route path="/guides" element={<Navigate to="/#guides" replace />} />
        <Route path="/links" element={<Navigate to="/#links" replace />} />
        
        {/* Solution routes */}
        <Route path="/solutions/enterprise-ai" element={<Navigate to="/#enterprise-ai" replace />} />
        <Route path="/solutions/ai-integration" element={<Navigate to="/#ai-integration" replace />} />
        <Route path="/solutions/ai-training" element={<Navigate to="/#ai-training" replace />} />
        
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
