import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import { applyToJob } from "@/api/apiApplications";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useFetch from "@/hooks/use-fetch";

const currentYear = new Date().getFullYear();
const allowedResumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  mobile_number: z.string().trim().min(3, "Mobile number is required"),
  country: z.string().trim().min(1, "Country is required"),
  address: z.string().trim().min(1, "Address is required"),
  higher_education: z.string().trim().min(1, "Education is required"),
  passed_out_year: z.coerce.number().int().min(1900).max(currentYear),
  languages_known: z.string().trim().min(1, "Languages are required"),
  skills: z.string().trim().min(1, "Skills are required"),
  experience_years: z.coerce.number().min(0).max(100),
  gender: z.enum(["male", "female", "other"]),
  career_level: z.enum(["fresher", "experienced"]),
  expected_salary: z.coerce.number().min(0),
  resume: z
    .any()
    .refine((files) => files?.length === 1, "Resume is required")
    .refine((files) => files?.[0]?.size <= 5_000_000, "Resume must be 5 MB or smaller")
    .refine((files) => allowedResumeTypes.has(files?.[0]?.type), "Use PDF, DOC, or DOCX"),
});

const ErrorText = ({ error }) =>
  error ? <p className="mt-1 text-sm text-red-500">{error.message}</p> : null;

export function ApplyJobDrawer({ user, job, fetchJob, applied = false }) {
  const [open, setOpen] = useState(false);
  const { loading, error, fn: apply } = useFetch(applyToJob);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  if (job?.job_url) {
    return (
      <Button
        size="lg"
        className="mb-10"
        disabled={!job.isOpen}
        onClick={() => window.open(job.job_url, "_blank", "noopener,noreferrer")}
      >
        {job.isOpen ? "Apply on company site" : "Hiring closed"}
      </Button>
    );
  }

  const onSubmit = async (data) => {
    try {
      await apply({
        ...data,
        job_id: job.id,
        candidate_id: user.id,
        resume: data.resume[0],
      });
      await fetchJob();
      reset();
      setOpen(false);
    } catch {
      return;
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          className="mb-10"
          variant={job.isOpen && !applied ? "blue" : "destructive"}
          disabled={!job.isOpen || applied}
        >
          {job.isOpen ? (applied ? "Applied" : "Apply") : "Hiring closed"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh] overflow-y-auto">
        <DrawerHeader className="flex-row items-start justify-between">
          <div>
            <DrawerTitle>
              Apply for {job.title} at {job.company?.name}
            </DrawerTitle>
            <DrawerDescription>Complete the form and attach your resume.</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button type="button" variant="destructive">Close</Button>
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" {...register("first_name")} />
            <ErrorText error={errors.first_name} />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" {...register("last_name")} />
            <ErrorText error={errors.last_name} />
          </div>
          <div>
            <Label htmlFor="mobile_number">Mobile number</Label>
            <Input id="mobile_number" {...register("mobile_number")} />
            <ErrorText error={errors.mobile_number} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} />
            <ErrorText error={errors.country} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            <ErrorText error={errors.address} />
          </div>
          <div>
            <Label htmlFor="higher_education">Higher education</Label>
            <select id="higher_education" className="flex h-10 w-full rounded-md border border-input bg-background px-3" {...register("higher_education")}>
              <option value="">Select education</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="masters">Masters</option>
              <option value="doctorate">Doctorate</option>
              <option value="professional_degree">Professional degree</option>
              <option value="diploma">Diploma</option>
            </select>
            <ErrorText error={errors.higher_education} />
          </div>
          <div>
            <Label htmlFor="passed_out_year">Graduation year</Label>
            <Input id="passed_out_year" type="number" min="1900" max={currentYear} {...register("passed_out_year")} />
            <ErrorText error={errors.passed_out_year} />
          </div>
          <div>
            <Label htmlFor="languages_known">Languages</Label>
            <Input id="languages_known" {...register("languages_known")} />
            <ErrorText error={errors.languages_known} />
          </div>
          <div>
            <Label htmlFor="skills">Skills</Label>
            <Input id="skills" {...register("skills")} />
            <ErrorText error={errors.skills} />
          </div>
          <div>
            <Label htmlFor="experience_years">Experience in years</Label>
            <Input id="experience_years" type="number" min="0" step="0.5" {...register("experience_years")} />
            <ErrorText error={errors.experience_years} />
          </div>
          <div>
            <Label htmlFor="expected_salary">Expected salary</Label>
            <Input id="expected_salary" type="number" min="0" {...register("expected_salary")} />
            <ErrorText error={errors.expected_salary} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3" {...register("gender")}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <ErrorText error={errors.gender} />
          </div>
          <div>
            <Label htmlFor="career_level">Career level</Label>
            <select id="career_level" className="flex h-10 w-full rounded-md border border-input bg-background px-3" {...register("career_level")}>
              <option value="">Select career level</option>
              <option value="fresher">Fresher</option>
              <option value="experienced">Experienced</option>
            </select>
            <ErrorText error={errors.career_level} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="resume">Resume</Label>
            <Input id="resume" type="file" accept=".pdf,.doc,.docx" {...register("resume")} />
            <ErrorText error={errors.resume} />
          </div>
          {error && <p className="text-red-500 md:col-span-2">{error.message}</p>}
          {loading && <BarLoader width="100%" color="#36d7b7" className="md:col-span-2" />}
          <Button type="submit" variant="blue" size="lg" disabled={loading} className="md:col-span-2">
            Submit application
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
