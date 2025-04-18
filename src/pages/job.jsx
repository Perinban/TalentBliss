import { useUser } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs.js";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import ApplicationCard from "@/components/application-card";
import { ApplyJobDrawer } from "@/components/apply-job";

const Job = () => {
    const { isLoaded, user } = useUser();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);  // Added loading state
    const {
        loading: loadingJob,
        data: job,
        fn: fnJob,
    } = useFetch(getSingleJob, { job_id: id });

    const { fn: fnHiringStatus } = useFetch(updateHiringStatus, { job_id: id });

    const handleStatusChange = (value) => {
        fnHiringStatus(value === "open").then(() => fnJob());
    };

    useEffect(() => {
        if (isLoaded) {
            fnJob().then(() => setLoading(false));  // Set loading to false after data is fetched
        }
    }, [isLoaded]);

    if (loading || loadingJob) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    const convertNewlinesToBr = (text) =>
        text?.split("\n").map((line, index) => (
            <span key={index}>
                {line}
                <br />
            </span>
        ));

    const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
    const isOwnJob = job?.recruiter_id === user?.id;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-xl p-12 mb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-6">
                    <div className="flex gap-6 items-start">
                        <img
                            src={job?.company?.logo_url}
                            className="h-16 w-16 rounded-full object-cover"
                            alt={job?.title}
                        />
                        <div>
                            <h1 className="font-extrabold text-4xl text-gray-900">{job?.title}</h1>
                            <div className="flex flex-wrap gap-8 mt-4 text-gray-600">
                                <div className="flex gap-2 items-center">
                                    <MapPinIcon size={20} />
                                    <span>{job?.country}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Briefcase size={20} />
                                    <span>{job?.applications?.length} Applicants</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {job?.isOpen ? (
                                        <>
                                            <DoorOpen className="text-green-500" size={20} />
                                            Open
                                        </>
                                    ) : (
                                        <>
                                            <DoorClosed className="text-red-500" size={20} />
                                            Closed
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hiring Status Dropdown (Placed above "About the job") */}
                {isRecruiter && isOwnJob && (
                    <div className="w-full sm:w-auto mb-8">
                        <Select onValueChange={handleStatusChange} className="w-full sm:w-[350px]">
                            <SelectTrigger
                                className={`w-full rounded-xl border px-4 py-3 text-white shadow-md transition ${
                                    job?.isOpen
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                <SelectValue placeholder={`Hiring Status: ${job?.isOpen ? "Open" : "Closed"}`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Job Description */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">About the job</h2>
                    <p className="text-gray-700">{job?.description}</p>
                </div>

                {/* Requirements */}
                {job?.requirements && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">What we are looking for</h2>
                        <div className="text-gray-700">{convertNewlinesToBr(job?.requirements)}</div>
                    </div>
                )}

                {/* Apply Button */}
                {!isRecruiter && (
                    <div className="flex justify-center mb-8">
                        <ApplyJobDrawer
                            job={job}
                            user={user}
                            fetchJob={fnJob}
                            applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
                        />
                    </div>
                )}

                {/* Applications */}
                {isRecruiter && isOwnJob && job?.applications?.length > 0 && (
                    <div className="mb-8">
                        <h2 className="font-bold text-xl mb-6 text-gray-800">Applications</h2>
                        {job?.applications.map((application) => (
                            <ApplicationCard key={application.id} application={application} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Job;
