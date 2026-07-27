import { useEffect } from "react";
import { HeartCrack } from "lucide-react";
import { BarLoader } from "react-spinners";
import { getApplications } from "@/api/apiApplications";
import ApplicationCard from "./application-card";
import useFetch from "@/hooks/use-fetch";

const CreatedApplications = () => {
  const { loading, data: applications, error, fn: fetchApplications } = useFetch(getApplications);

  useEffect(() => {
    fetchApplications().catch(() => {});
  }, [fetchApplications]);

  if (loading || applications === undefined) {
    return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  }
  if (error) return <p className="text-center text-red-500">{error.message}</p>;
  if (!applications?.length) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-gray-600">
        <HeartCrack size={48} className="mb-4 text-red-400" />
        <h2 className="mb-2 text-2xl font-semibold">No Applications Yet</h2>
        <p className="text-sm text-gray-500">The jobs you apply to will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="gradient-title pb-8 text-center text-3xl font-extrabold sm:text-5xl">
        My Applications
      </h1>
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} isCandidate />
      ))}
    </div>
  );
};

export default CreatedApplications;
