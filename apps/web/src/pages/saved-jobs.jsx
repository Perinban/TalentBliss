import { useCallback, useEffect } from "react";
import { HeartCrack } from "lucide-react";
import { BarLoader } from "react-spinners";
import { getSavedJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";

const SavedJobs = () => {
  const { loading, data: savedJobs, error, fn: fetchSavedJobs } = useFetch(getSavedJobs);
  const refreshSavedJobs = useCallback(() => fetchSavedJobs().catch(() => {}), [fetchSavedJobs]);

  useEffect(() => {
    refreshSavedJobs();
  }, [refreshSavedJobs]);

  if (loading || savedJobs === undefined) {
    return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  }
  if (error) return <p className="text-center text-red-500">{error.message}</p>;
  if (!savedJobs?.length) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-gray-600">
        <HeartCrack size={48} className="mb-4 text-red-400" />
        <h2 className="mb-2 text-2xl font-semibold">No Saved Jobs</h2>
        <p className="text-sm text-gray-500">
          Jobs you save will appear here. Start exploring and save the ones you like.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="gradient-title pb-8 text-center text-5xl font-extrabold sm:text-7xl">
        Saved Jobs
      </h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {savedJobs.map((saved) => (
          <JobCard
            key={saved.id}
            job={saved.job}
            savedInit
            onJobSaved={refreshSavedJobs}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedJobs;
