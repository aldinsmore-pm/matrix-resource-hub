
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

interface User {
  email: string;
  isSubscribed: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const location = useLocation();
  const user = localStorage.getItem("user");
  
  if (!user) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const parsedUser = JSON.parse(user) as User;
  
  if (requireSubscription && !parsedUser.isSubscribed) {
    // User is logged in but doesn't have a subscription
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has required subscription
  return <>{children}</>;
};

export default ProtectedRoute;
