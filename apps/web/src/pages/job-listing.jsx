import { useEffect, useMemo } from "react";
import { BarLoader } from "react-spinners";
import { getJobs } from "@/api/apiJobs";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import JobCard from "@/components/job-card.jsx";
import { useCompanies } from "@/hooks/companies-context";
import { useDebounce } from "@/hooks/use-debounce.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import useSessionStorage from "@/hooks/useSessionStorage";

const jobsPerPage = 9;

const JobListing = () => {
  const [searchQuery, setSearchQuery] = useSessionStorage("jobSearchQuery", "");
  const [descriptionQuery, setDescriptionQuery] = useSessionStorage("jobDescriptionQuery", "");
  const [country, setCountry] = useSessionStorage("selectedCountry", "");
  const [state, setState] = useSessionStorage("selectedState", "");
  const [companyId, setCompanyId] = useSessionStorage("selectedCompanyId", "");
  const [currentPage, setCurrentPage] = useSessionStorage("currentJobPage", 1);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedDescription = useDebounce(descriptionQuery, 400);
  const { companies, loading: loadingCompanies } = useCompanies();

  const { fn: fetchJobs, data: response, loading, error } = useFetch(getJobs, {
    state,
    country,
    company_id: companyId,
    searchQuery: debouncedSearch,
    descriptionQuery: debouncedDescription,
    page: currentPage,
    limit: jobsPerPage,
  });

  useEffect(() => {
    fetchJobs().catch(() => {});
  }, [fetchJobs, state, country, companyId, debouncedSearch, debouncedDescription, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [country, state, companyId, debouncedSearch, debouncedDescription, setCurrentPage]);

  const jobs = useMemo(() => response?.jobs || [], [response]);
  const totalPages = Math.max(1, Math.ceil((response?.total || 0) / jobsPerPage));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="gradient-title pb-8 text-center text-4xl font-extrabold sm:text-5xl md:text-6xl">
        Latest Jobs
      </h1>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="search"
          placeholder="Search job titles"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Input
          type="search"
          placeholder="Search job descriptions"
          value={descriptionQuery}
          onChange={(event) => setDescriptionQuery(event.target.value)}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Input
          type="search"
          placeholder="Country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
        <Input
          type="search"
          placeholder="State or region"
          value={state}
          onChange={(event) => setState(event.target.value)}
        />
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          disabled={loadingCompanies}
        >
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {loading && !response ? (
        <BarLoader className="mt-8" width="100%" color="#36d7b7" />
      ) : error ? (
        <p className="py-12 text-center text-red-500">{error.message}</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.length ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} savedInit={job.saved?.length > 0} />
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-xl font-medium text-gray-600">
              No jobs found matching your criteria.
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mb-8 mt-8 flex items-center justify-center gap-4">
          <Button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span>
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

export default JobListing;
