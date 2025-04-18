import { getSavedJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useCallback } from "react";
import { BarLoader } from "react-spinners";

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
        return <div className="text-center mt-8">No Saved Jobs 👀</div>;
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