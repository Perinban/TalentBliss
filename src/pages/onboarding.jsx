import { useUser } from "@clerk/clerk-react";
import { BarLoader } from 'react-spinners';
import { Button } from "@/components/ui/button.jsx";
import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";

// Memoized Button Component
const MemoizedButton = React.memo(Button);

const Onboarding = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // If the user data is loaded and they have a role, navigate accordingly
        if (isLoaded) {
            if (user?.unsafeMetadata?.role) {
                navigate(user.unsafeMetadata.role === 'recruiter' ? "/post-job" : "/jobs");
            }
        }
    }, [user, isLoaded, navigate]);

    // Show loading spinner if the user data is still loading
    if (!isLoaded) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    // If no role is set, show the onboarding buttons
    const handleRoleSelection = async (role) => {
        try {
            await user.update({
                unsafeMetadata: { role },
            });
            navigate(role === 'recruiter' ? "/post-job" : "/jobs");
        } catch (err) {
            console.error("Error updating role:", err);
        }
    };

    // If user already has a role, they are being navigated away, so we don't render the buttons
    if (user?.unsafeMetadata?.role) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center mt-20 md:mt-32">
            <h2 className="gradient-title font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tighter text-center">
                I am a...
            </h2>
            <div className="mt-12 sm:mt-16 flex gap-8 w-full px-8 md:px-40 justify-center">
                <MemoizedButton
                    variant='blue'
                    className="h-56 text-4xl sm:text-5xl px-16 py-6 border-0 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full hover:from-blue-600 hover:to-blue-800 transition duration-300 ease-in-out shadow-lg"
                    onClick={() => handleRoleSelection("candidate")}
                >
                    Candidate
                </MemoizedButton>
                <MemoizedButton
                    variant='destructive'
                    className="h-56 text-4xl sm:text-5xl px-16 py-6 border-0 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-full hover:from-red-600 hover:to-red-800 transition duration-300 ease-in-out shadow-lg"
                    onClick={() => handleRoleSelection("recruiter")}
                >
                    Recruiter
                </MemoizedButton>
            </div>
        </div>
    );
};

export default Onboarding;