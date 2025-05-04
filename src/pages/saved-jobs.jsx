import { getSavedJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useCallback } from "react";
import { BarLoader } from "react-spinners";
import { HeartCrack } from "lucide-react";

const SavedJobs = () => {
    const { isLoaded } = useUser();

    const {
        loading: loadingSavedJobs,
        data: savedJobs = [],
        fn: fnSavedJobs,
    } = useFetch(getSavedJobs, false);

    // Memoize the refresh function
    const refreshSavedJobs = useCallback(() => {
        fnSavedJobs();
    }, [fnSavedJobs]);

    useEffect(() => {
        if (isLoaded) {
            refreshSavedJobs();
        }
    }, [isLoaded]); // Only depends on isLoaded

    if (!isLoaded || loadingSavedJobs) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    if (savedJobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-16 text-gray-600">
                <HeartCrack size={48} className="mb-4 text-red-400" />
                <h2 className="text-2xl font-semibold mb-2">No Saved Jobs</h2>
                <p className="text-sm text-gray-500">Jobs you save will appear here. Start exploring and save the ones you like!</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl text-center pb-8">
                Saved Jobs
            </h1>

            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedJobs.map((saved) => (
                    <JobCard
                        key={saved.id}
                        job={saved.job}
                        savedInit={true}
                        onJobSaved={refreshSavedJobs}
                    />
                ))}
            </div>
        </div>
    );
};

export default SavedJobs;