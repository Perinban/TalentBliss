import { useEffect } from "react";
import { Briefcase, DoorClosed, DoorOpen, ExternalLink, MapPinIcon } from "lucide-react";
import { Link, useParams } from "@/routing";
import { BarLoader } from "react-spinners";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs.js";
import { assetUrl } from "@/api/client";
import { useUser } from "@/auth/auth-context";
import ApplicationCard from "@/components/application-card";
import { ApplyJobDrawer } from "@/components/apply-job";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import useFetch from "@/hooks/use-fetch.jsx";

const Job = () => {
  const { isLoaded, user } = useUser();
  const { id } = useParams();
  const { loading: loadingJob, data: job, fn: fetchJob, error } = useFetch(getSingleJob, { job_id: id });
  const { fn: updateStatus } = useFetch(updateHiringStatus, { job_id: id });

  useEffect(() => {
    if (isLoaded) fetchJob().catch(() => {});
  }, [isLoaded, fetchJob]);

  if (!isLoaded || loadingJob || job === undefined) {
    return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  }
  if (error || !job) {
    return <p className="py-16 text-center text-red-500">{error?.message || "Job not found"}</p>;
  }

  const isRecruiter = user?.role === "recruiter";
  const isCandidate = user?.role === "candidate";
  const isOwnJob = job.recruiter_id === user?.id;
  const externalApplicationUrl =
    job.source === "join" && /^https?:\/\//i.test(job.job_url || "") ? job.job_url : null;
  const applied = job.applications?.some((application) => application.candidate_id === user?.id);

  const handleStatusChange = async (value) => {
    await updateStatus(value === "open");
    await fetchJob();
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-12 rounded-2xl bg-white p-12 shadow-xl">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-6">
            {job.company?.logo_url ? (
              <img
                src={assetUrl(job.company.logo_url)}
                className="h-16 w-16 rounded-full object-contain"
                alt={job.company.name}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-100" />
            )}
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">{job.title}</h1>
              <p className="mt-2 text-lg text-gray-600">{job.company?.name}</p>
              <div className="mt-4 flex flex-wrap gap-8 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPinIcon size={20} />
                  <span>{job.location || [job.state, job.country].filter(Boolean).join(", ") || "Location not specified"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={20} />
                  <span>{job.application_count || 0} Applicants</span>
                </div>
                <div className="flex items-center gap-2">
                  {job.isOpen ? <DoorOpen className="text-green-500" size={20} /> : <DoorClosed className="text-red-500" size={20} />}
                  {job.isOpen ? "Open" : "Closed"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isRecruiter && isOwnJob && (
          <div className="mb-8 w-full sm:w-auto">
            <Select onValueChange={handleStatusChange} defaultValue={job.isOpen ? "open" : "closed"}>
              <SelectTrigger className={"w-full rounded-xl px-4 py-3 text-white shadow-md sm:w-[350px] " + (job.isOpen ? "bg-green-600" : "bg-red-600")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">About the job</h2>
          <p className="whitespace-pre-line text-gray-700">{job.description}</p>
        </section>

        {job.requirements && (
          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">What we are looking for</h2>
            <p className="whitespace-pre-line text-gray-700">{job.requirements}</p>
          </section>
        )}

        {externalApplicationUrl && job.isOpen && (
          <div className="mb-8 flex justify-center">
            <Button asChild size="lg">
              <a href={externalApplicationUrl} target="_blank" rel="noopener noreferrer">
                Apply on JOIN
                <ExternalLink size={18} />
              </a>
            </Button>
          </div>
        )}
        {!externalApplicationUrl && isCandidate && (
          <div className="mb-8 flex justify-center">
            <ApplyJobDrawer job={job} user={user} fetchJob={fetchJob} applied={applied} />
          </div>
        )}
        {!user && (
          <div className="mb-8 flex justify-center">
            <Link to="/?sign-in=true">
              <Button size="lg" variant={externalApplicationUrl ? "outline" : "default"}>
                {externalApplicationUrl ? "Sign in to save jobs" : "Sign in to apply or save"}
              </Button>
            </Link>
          </div>
        )}

        {isRecruiter && isOwnJob && job.applications?.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Applications</h2>
            {job.applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Job;
