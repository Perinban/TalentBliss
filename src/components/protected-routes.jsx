import { useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const { isSignedIn, user, isLoaded } = useUser();
    const { pathname } = useLocation();

    // Return a loading state if the user data is not loaded
    if (!isLoaded) {
        return null; // You can return a loading spinner or message here if desired
    }

    // Redirect if user is not signed in
    if (!isSignedIn) {
        return <Navigate to="/?sign-in=true" />;
    }

    // Redirect to onboarding if the user has no role and is not on the onboarding page
    if (!user?.unsafeMetadata?.role && pathname !== '/TalentBliss/onboarding') {
        return <Navigate to="/TalentBliss/onboarding" />;
    }

    // If all checks pass, render the protected content
    return children;
};

export default ProtectedRoute;