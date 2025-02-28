
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isLoading, isAuthenticated, hasSubscription } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-matrix-bg">
        <div className="mb-4">Verifying authentication...</div>
        <div className="w-12 h-12 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // User is not logged in, redirect to login
  if (!isAuthenticated) {
    console.log("ProtectedRoute: No authenticated user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is logged in but doesn't have a subscription and it's required
  if (requireSubscription && !hasSubscription) {
    console.log("ProtectedRoute: User lacks subscription, redirecting to subscription page");
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has required subscription or it's not required
  console.log("ProtectedRoute: Access granted to protected route");
  return <>{children}</>;
};

export default ProtectedRoute;
