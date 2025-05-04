import { useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const { isSignedIn, user, isLoaded } = useUser();
    const { pathname } = useLocation();

    // Return a loading state if the user data is not loaded
    if (!isLoaded) {
        return null;
    }

    // Redirect if user is not signed in
    if ( !isSignedIn && isSignedIn !== undefined ) {
        return <Navigate to="/?sign-in=true" replace state={{ from: pathname }} />;
    }

    // Redirect to onboarding if the user has no role and is not on the onboarding page
    if ( user!== undefined && !user?.unsafeMetadata?.role && !pathname.includes("/onboarding" )) {
        return <Navigate to="/onboarding" replace />;
    }

    // If all checks pass, render the protected content
    return children;
};

export default ProtectedRoute;