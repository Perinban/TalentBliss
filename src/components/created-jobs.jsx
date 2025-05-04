import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "./job-card";
import { Button } from "@/components/ui/button.jsx";
import useFetch from "@/hooks/use-fetch";
import { getMyJobs } from "@/api/apiJobs";
import { useDebounce } from "@/hooks/use-debounce.jsx";

const jobsPerPage = 9;

const CreatedJobs = () => {
    const { user } = useUser();

    const [searchQuery, setSearchQuery] = useState(""); // Search by job title
    const [currentPage, setCurrentPage] = useState(1);

    // Debounced search query for job title
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Fetch jobs with search query and pagination
    const { loading: loadingCreatedJobs, data: createdJobs, fn: fnCreatedJobs } = useFetch(getMyJobs, {
        recruiter_id: user.id,
        searchQuery: debouncedSearchQuery,
        page: currentPage,
        limit: jobsPerPage,
    });

    // Filter jobs based on the debounced search query
    const filteredJobs = useMemo(() => {
        return createdJobs?.filter((job) =>
            job.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        ) || [];
    }, [createdJobs, debouncedSearchQuery]);

    // Calculate indices for pagination
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

    // Calculate total pages based on filtered jobs and jobs per page
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    // Fetch jobs when the component mounts or page changes
    useEffect(() => {
        fnCreatedJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearchQuery]);

    return (
        <div>

            <h1 className="gradient-title font-extrabold text-3xl sm:text-5xl text-center pb-8">
                My Jobs
            </h1>

            {/* Search Bar for Job Title */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search jobs by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-4 rounded-lg border border-gray-300 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 text-lg transition duration-300 ease-in-out"
                />
            </div>

            {loadingCreatedJobs ? (
                <BarLoader className="mt-4" width={"100%"} color="#36d7b7"/>
            ) : (
                <div>
                    {/* Jobs Grid */}
                    <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentJobs?.length ? (
                            currentJobs.map((job) => (
                                <JobCard key={job.id} job={job} onJobSaved={fnCreatedJobs} isMyJob/>
                            ))
                        ) : (
                            <div className="text-center text-gray-600 font-semibold mt-2">
                                <span className="text-lg">No Jobs Found. Try refining your search.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-4 mb-8">
                    <Button
                        onClick={() => setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="sm:w-auto"
                    >
                        Previous
                    </Button>
                    <span className="text-center mt-2">Page {currentPage} of {totalPages}</span>
                    <Button
                        onClick={() => setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="sm:w-auto"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CreatedJobs;