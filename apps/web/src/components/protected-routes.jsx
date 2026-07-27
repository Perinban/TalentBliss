import { Navigate, useLocation } from "@/routing";
import { useUser } from "@/auth/auth-context";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { pathname } = useLocation();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return <Navigate to="/?sign-in=true" replace state={{ from: pathname }} />;
  }
  if (!user?.role && !pathname.includes("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

export default ProtectedRoute;
