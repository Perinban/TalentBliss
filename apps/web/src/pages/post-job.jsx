import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "@/routing";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import { addNewJob } from "@/api/apiJobs";
import { useUser } from "@/auth/auth-context";
import AddCompanyDrawer from "@/components/add-company-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCompanies } from "@/hooks/companies-context.jsx";
import useFetch from "@/hooks/use-fetch";

const schema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().min(10, "Add a useful job description"),
  country: z.string().trim().min(1, "Country is required"),
  state: z.string().trim().min(1, "State or region is required"),
  company_id: z.string().uuid("Select a company"),
  requirements: z.string().trim().min(1, "Requirements are required"),
  mode: z.string().trim().min(1, "Work mode is required"),
  domain: z.string().trim().min(1, "Domain is required"),
  salary: z.string().trim().min(1, "Salary information is required"),
});

const FieldError = ({ error }) =>
  error ? <p className="mt-1 text-sm text-red-500">{error.message}</p> : null;

const PostJob = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { companies, loading: loadingCompanies } = useCompanies();
  const { loading, error, fn: createJob } = useFetch(addNewJob);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await createJob(data);
      navigate("/my-jobs");
    } catch {
      return;
    }
  };

  if (!isLoaded || loadingCompanies) {
    return <BarLoader className="mb-4" width="100%" color="#36d7b7" />;
  }
  if (user?.role !== "recruiter") return <Navigate to="/jobs" replace />;

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-lg">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="gradient-title text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Post a Job
        </h1>
        <AddCompanyDrawer />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input placeholder="Job title" {...register("title")} />
          <FieldError error={errors.title} />
        </div>
        <div>
          <Textarea rows={6} placeholder="Job description" {...register("description")} />
          <FieldError error={errors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Input placeholder="Country" {...register("country")} />
            <FieldError error={errors.country} />
          </div>
          <div>
            <Input placeholder="State or region" {...register("state")} />
            <FieldError error={errors.state} />
          </div>
          <div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
              {...register("company_id")}
            >
              <option value="" disabled>
                Select company
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError error={errors.company_id} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Input placeholder="Mode: remote, hybrid, onsite" {...register("mode")} />
            <FieldError error={errors.mode} />
          </div>
          <div>
            <Input placeholder="Domain" {...register("domain")} />
            <FieldError error={errors.domain} />
          </div>
          <div>
            <Input placeholder="Salary and currency" {...register("salary")} />
            <FieldError error={errors.salary} />
          </div>
        </div>

        <div>
          <Textarea rows={8} placeholder="Requirements" {...register("requirements")} />
          <FieldError error={errors.requirements} />
        </div>

        {error && <p className="text-sm text-red-500">{error.message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Posting..." : "Post job"}
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
