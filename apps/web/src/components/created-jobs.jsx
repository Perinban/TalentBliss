import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { getMyJobs } from "@/api/apiJobs";
import JobCard from "./job-card";
import { Button } from "@/components/ui/button.jsx";
import { useDebounce } from "@/hooks/use-debounce.jsx";
import useFetch from "@/hooks/use-fetch";

const jobsPerPage = 9;

const CreatedJobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    loading,
    data: response,
    error,
    fn: fetchCreatedJobs,
  } = useFetch(getMyJobs, {
    searchQuery: debouncedSearchQuery,
    page: currentPage,
    limit: jobsPerPage,
  });

  useEffect(() => {
    fetchCreatedJobs().catch(() => {});
  }, [fetchCreatedJobs, currentPage, debouncedSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const jobs = response?.jobs || [];
  const totalPages = Math.max(1, Math.ceil((response?.total || 0) / jobsPerPage));

  return (
    <div>
      <h1 className="gradient-title pb-8 text-center text-3xl font-extrabold sm:text-5xl">
        My Jobs
      </h1>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search jobs by title..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-4 text-lg shadow-xl transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {loading ? (
        <BarLoader className="mt-4" width="100%" color="#36d7b7" />
      ) : error ? (
        <p className="mt-8 text-center text-red-500">{error.message}</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.length ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} onJobSaved={fetchCreatedJobs} isMyJob />
            ))
          ) : (
            <p className="text-center font-semibold text-gray-600">No jobs found.</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mb-8 mt-8 flex justify-center gap-4">
          <Button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span className="mt-2 text-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreatedJobs;
