import { Country, State } from 'country-state-city';
import { getJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch.jsx";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "@/components/job-card.jsx";
import { useCompanies } from "@/hooks/companies-context";
import { Input } from "@/components/ui/input.jsx";
import Select from "react-select";
import { useDebounce } from "@/hooks/use-debounce.jsx";
import { Button } from "@/components/ui/button.jsx";
import useSessionStorage from "@/hooks/useSessionStorage";

const jobsPerPage = 9;
const optionsPerLoad = 20;

const JobCards = ({ jobs, loading }) => {
    if (loading) return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;

    return (
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length > 0 ? jobs.map(job => (
                <JobCard key={job.id} job={job} savedInit={job?.saved?.length > 0} />
            )) : (
                <div className="col-span-3 text-center py-12">
                    <p className="text-xl font-medium text-gray-600">
                        No jobs found matching your criteria
                    </p>
                </div>
            )}
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, setCurrentPage, loading }) => (
    totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-4 mb-8">
            <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading}>
                Previous
            </Button>
            <span className="text-sm sm:text-base">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading}>
                Next
            </Button>
        </div>
    )
);

const Filters = ({
                     country,
                     setCountry,
                     state,
                     setState,
                     company_id,
                     setCompanyId,
                     countryOptions,
                     stateOptions,
                     companyOptions,
                     loadMoreOptions
                 }) => {
    const observerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                loadMoreOptions();
            }
        }, { rootMargin: '100px' });

        if (observerRef.current) observer.observe(observerRef.current);

        return () => observer.disconnect();
    }, [loadMoreOptions]);

    return (
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <Select
                value={countryOptions.find(c => c.value === country) || null}
                onChange={(option) => setCountry(option?.value || "")}
                options={countryOptions}
                placeholder="Filter By Country"
                isClearable
                className="w-full"
            />
            <Select
                value={stateOptions.find(s => s.value === state) || null}
                onChange={(option) => setState(option?.value || "")}
                options={stateOptions}
                placeholder="Filter By State"
                isClearable
                isDisabled={!country}
                className="w-full"
            />
            <Select
                value={companyOptions.find(c => c.value === company_id) || null}
                onChange={(option) => setCompanyId(option?.value || "")}
                options={companyOptions}
                placeholder="Filter By Company"
                isClearable
                className="w-full"
            />
            {/* Sentinel div for lazy loading more options */}
            <div ref={observerRef} style={{ height: '1px' }} />
        </div>
    );
};

const JobListing = () => {
    // Filters & pagination states with session storage persistence
    const [searchQuery, setSearchQuery] = useSessionStorage("jobSearchQuery", "");
    const [descriptionQuery, setDescriptionQuery] = useSessionStorage("jobDescriptionQuery", "");
    const [country, setCountry] = useSessionStorage("selectedCountry", "");
    const [state, setState] = useSessionStorage("selectedState", "");
    const [company_id, setCompanyId] = useSessionStorage("selectedCompanyId", "");
    const [currentPage, setCurrentPage] = useSessionStorage("currentJobPage", 1);

    // Options and offsets for lazy loading filter options
    const [countryOptions, setCountryOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);

    const [countryOffset, setCountryOffset] = useState(0);
    const [stateOffset, setStateOffset] = useState(0);
    const [companyOffset, setCompanyOffset] = useState(0);

    const { isLoaded } = useUser();
    const debouncedDescription = useDebounce(descriptionQuery, 500);

    const {
        fn: fetchJobs,
        data: jobsResponse,
        loading: loadingJobs,
        totalItems
    } = useFetch(getJobs, {
        state,
        country,
        company_id,
        searchQuery,
        descriptionQuery: debouncedDescription,
        page: currentPage,
        limit: jobsPerPage
    });

    const { companies, loading: loadingCompanies } = useCompanies();

    // Fetch jobs when user is loaded, companies loaded, and filters change
    useEffect(() => {
        if (!isLoaded || loadingCompanies) return;
        if (!companies?.length) return;

        fetchJobs();
    }, [
        isLoaded,
        loadingCompanies,
        companies.length,
        country,
        state,
        company_id,
        searchQuery,
        debouncedDescription,
        currentPage
    ]);

    // Reset state filter and related options when country changes
    useEffect(() => {
        setState("");
        setStateOffset(0);
        setStateOptions([]);
    }, [country]);

    // Reset page to 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [country, state, company_id, searchQuery, debouncedDescription]);

    // Lazy load filter options on scroll
    const loadMoreOptions = useCallback(() => {
        const allCountries = Country.getAllCountries();
        if (countryOffset < allCountries.length) {
            const newCountries = allCountries
                .slice(countryOffset, countryOffset + optionsPerLoad)
                .map(({ name, isoCode }) => ({ label: name, value: isoCode }));
            setCountryOptions(prev => [...prev, ...newCountries]);
            setCountryOffset(prev => prev + optionsPerLoad);
        }

        if (country) {
            const allStates = State.getStatesOfCountry(country);
            if (stateOffset < allStates.length) {
                const newStates = allStates
                    .slice(stateOffset, stateOffset + optionsPerLoad)
                    .map(({ name, isoCode }) => ({ label: name, value: isoCode }));
                setStateOptions(prev => [...prev, ...newStates]);
                setStateOffset(prev => prev + optionsPerLoad);
            }
        }

        if (Array.isArray(companies) && companyOffset < companies.length) {
            const newCompanies = companies
                .slice(companyOffset, companyOffset + optionsPerLoad)
                .map(({ name, id }) => ({ label: name, value: id }));
            setCompanyOptions(prev => [...prev, ...newCompanies]);
            setCompanyOffset(prev => prev + optionsPerLoad);
        }
    }, [country, stateOffset, countryOffset, companyOffset, companies]);

    // Initial load of filter options
    useEffect(() => {
        loadMoreOptions();
    }, [loadMoreOptions]);

    // Extract jobs array safely
    const currentJobs = useMemo(() => {
        if (Array.isArray(jobsResponse)) return jobsResponse;
        return jobsResponse?.jobs || [];
    }, [jobsResponse]);

    // Compute total pages
    const totalJobsCount = totalItems ?? currentJobs.length;
    const totalPages = Math.max(1, Math.ceil(totalJobsCount / jobsPerPage));

    if (loadingCompanies || !isLoaded) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl md:text-6xl text-center pb-8">
                Latest Jobs
            </h1>

            <form className="h-14 flex flex-col sm:flex-row w-full gap-2 items-center mb-4" onSubmit={e => e.preventDefault()}>
                <Input
                    type="text"
                    placeholder="Search Jobs by Title..."
                    className="h-full flex-1 px-4 text-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input
                    type="text"
                    placeholder="Search Jobs by Description"
                    className="h-full flex-1 px-4 text-md"
                    value={descriptionQuery}
                    onChange={(e) => setDescriptionQuery(e.target.value)}
                />
            </form>

            <Filters
                country={country}
                setCountry={setCountry}
                state={state}
                setState={setState}
                company_id={company_id}
                setCompanyId={setCompanyId}
                countryOptions={countryOptions}
                stateOptions={stateOptions}
                companyOptions={companyOptions}
                loadMoreOptions={loadMoreOptions}
            />

            <JobCards jobs={currentJobs} loading={loadingJobs} />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                loading={loadingJobs}
            />
        </div>
    );
};

export default JobListing;