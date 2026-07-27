import { useEffect, useState } from "react";
import { useNavigate } from "@/routing";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button.jsx";

const Onboarding = () => {
  const { user, isLoaded, updateRole } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user?.role) {
      navigate(user.role === "recruiter" ? "/post-job" : "/jobs", { replace: true });
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded) return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  if (user?.role) return null;

  const chooseRole = async (role) => {
    setSaving(true);
    setError("");
    try {
      await updateRole(role);
      navigate(role === "recruiter" ? "/post-job" : "/jobs", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-20 flex flex-col items-center justify-center md:mt-32">
      <h2 className="gradient-title text-center text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
        I am a...
      </h2>
      <div className="mt-12 flex w-full justify-center gap-8 px-8 sm:mt-16 md:px-40">
        <Button
          variant="blue"
          className="h-56 rounded-full border-0 bg-gradient-to-r from-blue-500 to-blue-700 px-16 py-6 text-4xl text-white shadow-lg transition hover:from-blue-600 hover:to-blue-800 sm:text-5xl"
          onClick={() => chooseRole("candidate")}
          disabled={saving}
        >
          Candidate
        </Button>
        <Button
          variant="destructive"
          className="h-56 rounded-full border-0 bg-gradient-to-r from-red-500 to-red-700 px-16 py-6 text-4xl text-white shadow-lg transition hover:from-red-600 hover:to-red-800 sm:text-5xl"
          onClick={() => chooseRole("recruiter")}
          disabled={saving}
        >
          Recruiter
        </Button>
      </div>
      {error && <p className="mt-6 text-red-500">{error}</p>}
    </div>
  );
};

export default Onboarding;
