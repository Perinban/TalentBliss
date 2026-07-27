import { BarLoader } from "react-spinners";
import { useUser } from "@/auth/auth-context";
import CreatedApplications from "@/components/created-applications";
import CreatedJobs from "@/components/created-jobs";

const MyJobs = () => {
  const { user, isLoaded, error } = useUser();

  if (!isLoaded) return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  if (error) {
    return <p className="text-center text-red-500">Error loading user data. Please try again.</p>;
  }
  return user?.role === "candidate" ? <CreatedApplications /> : <CreatedJobs />;
};

export default MyJobs;
