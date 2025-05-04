import CreatedApplications from "@/components/created-applications";
import CreatedJobs from "@/components/created-jobs";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { useState, useEffect, useMemo } from "react";

const MyJobs = () => {
    const { user, isLoaded, isSignedIn, error } = useUser();

    const role = useMemo(() => {
        return isLoaded ? user?.unsafeMetadata?.role : null;
    }, [isLoaded, user]);

    const loading = !isLoaded;

    if (loading) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    if (error) {
        return (
            <div className="text-center text-red-500">
                <p>Error loading user data. Please try again later.</p>
            </div>
        );
    }

    return (
        <div>
            {role === "candidate" ? (
                <CreatedApplications />
            ) : (
                <CreatedJobs />
            )}
        </div>
    );
};

export default MyJobs;
