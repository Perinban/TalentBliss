import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { addNewJob } from "@/api/apiJobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useSessionStorage from "@/hooks/useSessionStorage";
import { useCompanies } from "@/hooks/companies-context.jsx";
import useFetch from "@/hooks/use-fetch";

const AddCompanyDrawer = lazy(() => import("@/components/add-company-drawer"));
const MDEditor = lazy(() => import("@uiw/react-md-editor"));
const Select = lazy(() => import("react-select"));

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    company_id: z.string().min(1, "Select or Add a new Company"),
    requirements: z.string().min(1, "Requirements are required"),
    mode: z.string().min(1, "Mode is required"),
    domain: z.string().min(1, "Domain is required"),
    salary: z.string().min(1, "Salary is required"),
});

const PostJob = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        watch,
    } = useForm({
        defaultValues: {
            state: "",
            country: "",
            company_id: "",
            requirements: "",
            mode: "",
            domain: "",
            salary: "",
        },
        resolver: zodResolver(schema),
    });

    const [country, setCountry] = useState(null);
    const [state, setState] = useState(null);
    const [showCountrySelect, setShowCountrySelect] = useState(false);
    const [showStateSelect, setShowStateSelect] = useState(false);
    const [showCompanySelect, setShowCompanySelect] = useState(false);
    const [showRequirementsEditor, setShowRequirementsEditor] = useState(false);

    const { companies, loading: loadingCompanies } = useCompanies();

    const {
        loading: loadingCreateJob,
        error: errorCreateJob,
        data: dataCreateJob,
        fn: fnCreateJob,
    } = useFetch(addNewJob);

    const [countries, setCountries] = useSessionStorage("countries", []);
    const [states, setStates] = useSessionStorage("states", []);

    const loadCountries = async () => {
        if (countries.length > 0) return;
        const { Country } = await import("country-state-city");
        const allCountries = Country.getAllCountries().map(({ name, isoCode }) => ({
            label: name,
            value: isoCode,
        }));
        setCountries(allCountries);
    };

    const loadStates = async (countryCode) => {
        const key = `states-${countryCode}`;
        const cachedStates = sessionStorage.getItem(key);
        if (cachedStates) {
            setStates(JSON.parse(cachedStates));
            return;
        }

        const { State } = await import("country-state-city");
        const allStates = State.getStatesOfCountry(countryCode).map(({ name, isoCode }) => ({
            label: name,
            value: isoCode,
        }));
        setStates(allStates);
        sessionStorage.setItem(key, JSON.stringify(allStates));
    };

    const companyOptions = useMemo(() => {
        if (!companies) return [];
        return companies.map(({ name, id }) => ({
            label: name,
            value: id.toString(),
        }));
    }, [companies]);

    useEffect(() => {
        if (country) {
            setState(null);
            setValue("state", "");
            loadStates(country.value);
        }
    }, [country]);

    const onSubmit = (data) => {
        const jobData = {
            ...data,
            recruiter_id: user.id,
            isOpen: true,
            posted_date: new Date().toISOString(),
        };
        fnCreateJob(jobData);
    };

    useEffect(() => {
        if (dataCreateJob?.length > 0) navigate("/jobs");
    }, [dataCreateJob]);

    if (!isLoaded) return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    if (user?.unsafeMetadata?.role !== "recruiter") return <Navigate to="/jobs" />;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl">
            <h1 className="gradient-title font-extrabold text-3xl sm:text-4xl text-center pb-8 text-gray-900">
                Post a Job
            </h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 flex flex-col max-h-[calc(100vh-200px)] overflow-auto"
            >
                {/* Title & Description */}
                <div className="space-y-1">
                    <Input className="input-primary" placeholder="Job Title" {...register("title")} />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>

                <div className="space-y-1">
                    <Textarea className="textarea-primary" placeholder="Job Description" {...register("description")} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>

                {/* Country, State, Company */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Country */}
                    <div className="w-full sm:w-1/3">
                        {showCountrySelect ? (
                            <Suspense fallback={<BarLoader color="#36d7b7" />}>
                                <Controller
                                    name="country"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            value={countries.find((c) => c.value === field.value) || null}
                                            onChange={(option) => {
                                                field.onChange(option?.value || "");
                                                setCountry(option);
                                            }}
                                            options={countries}
                                            placeholder="Select Country"
                                            isClearable
                                            onFocus={() => {
                                                if (countries.length === 0) loadCountries();
                                            }}
                                        />
                                    )}
                                />
                            </Suspense>
                        ) : (
                            <Input
                                className="input-primary"
                                placeholder="Select Country"
                                onFocus={() => setShowCountrySelect(true)}
                                value={watch("country") ? countries.find(c => c.value === watch("country"))?.label || "" : ""}
                                readOnly
                            />
                        )}
                        {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                    </div>

                    {/* State */}
                    <div className="w-full sm:w-1/3">
                        {showStateSelect ? (
                            <Suspense fallback={<BarLoader color="#36d7b7" />}>
                                <Controller
                                    name="state"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            value={states.find((s) => s.value === field.value) || null}
                                            onChange={(option) => {
                                                field.onChange(option?.value || "");
                                                setState(option);
                                            }}
                                            options={states}
                                            placeholder="Select State"
                                            isClearable
                                            isDisabled={!country}
                                        />
                                    )}
                                />
                            </Suspense>
                        ) : (
                            <Input
                                className="input-primary"
                                placeholder="Select State"
                                onFocus={() => {
                                    if (country) setShowStateSelect(true);
                                }}
                                value={watch("state") ? states.find(s => s.value === watch("state"))?.label || "" : ""}
                                readOnly
                                disabled={!country}
                            />
                        )}
                        {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
                    </div>

                    {/* Company */}
                    <div className="w-full sm:w-1/3">
                        {showCompanySelect ? (
                            <Suspense fallback={<BarLoader color="#36d7b7" />}>
                                <Controller
                                    name="company_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            value={companyOptions.find((c) => c.value === field.value) || null}
                                            onChange={(option) => {
                                                field.onChange(option?.value || "");
                                            }}
                                            options={companyOptions}
                                            placeholder="Select Company"
                                            isClearable
                                            isLoading={loadingCompanies}
                                        />
                                    )}
                                />
                            </Suspense>
                        ) : (
                            <Input
                                className="input-primary"
                                placeholder="Select Company"
                                onFocus={() => setShowCompanySelect(true)}
                                value={watch("company_id") ? companyOptions.find(c => c.value === watch("company_id"))?.label || "" : ""}
                                readOnly
                            />
                        )}
                        {errors.company_id && <p className="text-red-500 text-sm">{errors.company_id.message}</p>}
                    </div>

                    {/* Add Company */}
                    {/* <AddCompanyDrawer/> */}
                </div>

                {/* Mode, Domain, Salary */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                        <Input placeholder="Mode (e.g., Remote)" {...register("mode")} />
                        {errors.mode && <p className="text-red-500 text-sm">{errors.mode.message}</p>}
                    </div>
                    <div className="w-full sm:w-1/3">
                        <Input placeholder="Domain (e.g., IT)" {...register("domain")} />
                        {errors.domain && <p className="text-red-500 text-sm">{errors.domain.message}</p>}
                    </div>
                    <div className="w-full sm:w-1/3">
                        <Input placeholder="Salary with Currency" {...register("salary")} />
                        {errors.salary && <p className="text-red-500 text-sm">{errors.salary.message}</p>}
                    </div>
                </div>

                {/* Requirements */}
                <div className="space-y-1">
                    {showRequirementsEditor ? (
                        <Suspense fallback={<BarLoader color="#36d7b7" />}>
                            <Controller
                                name="requirements"
                                control={control}
                                render={({ field }) => (
                                    <MDEditor value={field.value} onChange={field.onChange} />
                                )}
                            />
                        </Suspense>
                    ) : (
                        <Input
                            className="input-primary"
                            placeholder="Requirements"
                            onFocus={() => setShowRequirementsEditor(true)}
                            value={watch("requirements")}
                            readOnly
                        />
                    )}
                    {errors.requirements && <p className="text-red-500 text-sm">{errors.requirements.message}</p>}
                </div>

                <Button type="submit" disabled={loadingCreateJob}>
                    {loadingCreateJob ? "Posting..." : "Post Job"}
                </Button>
            </form>
        </div>
    );
};

export default PostJob;