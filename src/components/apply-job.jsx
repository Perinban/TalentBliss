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
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useFetch from "@/hooks/use-fetch";
import { applyToJob } from "@/api/apiApplications";
import { BarLoader } from "react-spinners";

const schema = z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    mobile_number: z.string().min(1, { message: "Mobile number is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    address: z.string().min(1, { message: "Address is required" }),
    higher_education: z.enum(
        ["undergraduate", "graduate", "postgraduate", "masters", "doctorate", "professional_degree", "diploma"],
        { message: "Select a valid education level" }
    ),
    passed_out_year: z.string().min(1, { message: "Invalid passed-out year" }).max(new Date().getFullYear(), { message: "Year cannot be in the future" }),
    languages_known: z.string().min(1, { message: "Languages are required" }),
    skills: z.string().min(1, { message: "Skills are required" }),
    experience_years: z.string().min(1, { message: "Experience must be at least 0" }),
    gender: z.enum(["male", "female", "other"], { message: "Select a valid gender" }),
    career_level: z.enum(["fresher", "experienced"], { message: "Select a career level" }),
    expected_salary: z.string().min(1, { message: "Expected salary must be a positive number" }),
    resume: z
        .any()
        .refine(
            (file) =>
                file[0] &&
                (file[0].type === "application/pdf" ||
                    file[0].type === "application/msword"),
            { message: "Only PDF or Word documents are allowed" }
        ),
});

export function ApplyJobDrawer({ user, job, fetchJob, applied = false }) {

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(schema),
    });

    const {
        loading: loadingApply,
        error: errorApply,
        fn: fnApply,
    } = useFetch(applyToJob);

    const onSubmit = (data) => {

        fnApply({
            ...data,
            job_id: job.id,
            candidate_id: user.id,
            status: "applied",
            resume: data.resume[0],
        }).then(() => {
            fetchJob();
            reset();
        });
    };

    const handleApplyClick = () => {

        if (job?.job_url) {
            window.open(job.job_url, "_blank");
            fetchJob();
        } else {
            return;
        }
    };

    return (
        <Drawer open={applied ? false : undefined}>
            <DrawerTrigger asChild>
                <Button
                    size="lg"
                    className="mb-10"
                    variant={job?.isOpen && !applied ? "blue" : "destructive"}
                    disabled={!job?.isOpen || applied}
                    onClick={handleApplyClick}
                >
                    {job?.isOpen ? (applied ? "Applied" : "Apply") : "Hiring Closed"}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-screen">
                <DrawerHeader className="flex justify-between items-start -mb-5">
                    <div>
                        <DrawerTitle>
                            Apply for {job?.title} at {job?.company?.name}
                        </DrawerTitle>
                        <DrawerDescription>
                            Please fill the form below
                        </DrawerDescription>
                    </div>
                    <DrawerClose className="flex items-start">
                        <Button className="text-sm mr-5" variant="destructive">X</Button>
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-4 pb-0">
                    {/* First Name and Last Name */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                type="text"
                                id="first_name"
                                placeholder="First Name"
                                {...register("first_name")}
                            />
                            {errors.first_name && <p className="text-red-500">{errors.first_name.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                type="text"
                                id="last_name"
                                placeholder="Last Name"
                                {...register("last_name")}
                            />
                            {errors.last_name && <p className="text-red-500">{errors.last_name.message}</p>}
                        </div>
                    </div>

                    {/* Mobile Number, Country, Address */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="mobile_number">Mobile Number</Label>
                            <Input
                                type="text"
                                id="mobile_number"
                                placeholder="Mobile Number"
                                {...register("mobile_number")}
                            />
                            {errors.mobile_number && <p className="text-red-500">{errors.mobile_number.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                type="text"
                                id="country"
                                placeholder="Country"
                                {...register("country")}
                            />
                            {errors.country && <p className="text-red-500">{errors.country.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                type="text"
                                id="address"
                                placeholder="Address"
                                {...register("address")}
                            />
                            {errors.address && <p className="text-red-500">{errors.address.message}</p>}
                        </div>
                    </div>

                    {/* Higher Education, Passed Out Year */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Higher Education</Label>
                            <Controller
                                name="higher_education"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} {...field}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="undergraduate" id="undergraduate" />
                                            <Label htmlFor="undergraduate">Undergraduate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="graduate" id="graduate" />
                                            <Label htmlFor="graduate">Graduate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="postgraduate" id="postgraduate" />
                                            <Label htmlFor="postgraduate">Post Graduate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="masters" id="masters" />
                                            <Label htmlFor="masters">Masters</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="doctorate" id="doctorate" />
                                            <Label htmlFor="doctorate">Doctorate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="professional_degree" id="professional_degree" />
                                            <Label htmlFor="professional_degree">Professional Degree</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="diploma" id="diploma" />
                                            <Label htmlFor="diploma">Diploma</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="passed_out_year">Passed-Out Year</Label>
                            <Input
                                type="number"
                                id="passed_out_year"
                                placeholder="Passed-Out Year"
                                {...register("passed_out_year")}
                            />
                            {errors.passed_out_year && <p className="text-red-500">{errors.passed_out_year.message}</p>}
                        </div>
                    </div>

                    {/* Languages Known and Skills */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="languages_known">Languages Known</Label>
                            <Input
                                type="text"
                                id="languages_known"
                                placeholder="Languages Known"
                                {...register("languages_known")}
                            />
                            {errors.languages_known && <p className="text-red-500">{errors.languages_known.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="skills">Skills (Comma Separated)</Label>
                            <Input
                                type="text"
                                id="skills"
                                placeholder="Skills"
                                {...register("skills")}
                            />
                            {errors.skills && <p className="text-red-500">{errors.skills.message}</p>}
                        </div>
                    </div>

                    {/* Experience and Gender */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="experience_years">Experience (in years)</Label>
                            <Input
                                type="number"
                                id="experience_years"
                                placeholder="Experience"
                                {...register("experience_years")}
                            />
                            {errors.experience_years && <p className="text-red-500">{errors.experience_years.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label>Gender</Label>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} {...field}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="male" id="male" />
                                            <Label htmlFor="male">Male</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="female" id="female" />
                                            <Label htmlFor="female">Female</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="other" id="other" />
                                            <Label htmlFor="other">Other</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                    </div>

                    {/* Career Level and Expected Salary */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Career Level</Label>
                            <Controller
                                name="career_level"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} {...field}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="fresher" id="fresher" />
                                            <Label htmlFor="fresher">Fresher</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="experienced" id="experienced" />
                                            <Label htmlFor="experienced">Experienced</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="expected_salary">Expected Salary</Label>
                            <Input
                                type="number"
                                id="expected_salary"
                                placeholder="Expected Salary"
                                {...register("expected_salary")}
                            />
                            {errors.expected_salary && <p className="text-red-500">{errors.expected_salary.message}</p>}
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div>
                        <Label htmlFor="resume">Upload Resume (PDF/Word)</Label>
                        <Input
                            type="file"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            {...register("resume")}
                        />
                        {errors.resume && <p className="text-red-500">{errors.resume.message}</p>}
                    </div>

                    {errorApply?.message && (
                        <p className="text-red-500">{errorApply?.message}</p>
                    )}
                    {loadingApply && <BarLoader width={"100%"} color="#36d7b7" />}
                    <Button type="submit" variant="blue" size="lg">
                        Apply
                    </Button>

                </form>
            </DrawerContent>
        </Drawer>
    );
}