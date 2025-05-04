import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useFetch from "@/hooks/use-fetch";
import { addNewCompany } from "@/api/apiCompanies";
import { BarLoader } from "react-spinners";
import { useState, useEffect } from "react";
import { useCompanies } from "@/hooks/companies-context";

const schema = z.object({
    name: z.string().min(1, "Company name is required"),
    logo: z.any()
        .refine((files) => files?.length > 0, "Logo is required")
        .refine((files) => files?.[0]?.size <= 1_000_000, "Max file size is 1MB")
        .refine(
            (files) => ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
            "Only .jpg, .png, and .webp formats are supported"
        ),
});

const AddCompanyDrawer = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        setError,
    } = useForm({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    const { fn: addCompany, loading } = useFetch(addNewCompany);
    const { companies, setCompanies } = useCompanies();

    const [open, setOpen] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({
        success: false,
        message: "",
    });

    const onSubmit = async (formData) => {
        const logoFile = formData.logo?.[0];

        // Check for existing company
        const existing = companies?.find(
            (company) => company.name.toLowerCase() === formData.name.toLowerCase()
        );

        if (existing) {
            setError("name", {
                type: "manual",
                message: "Company already exists",
            });
            setSubmitStatus({
                success: false,
                message: "Company already exists",
            });
            return;
        }

        try {
            const result = await addCompany({
                name: formData.name,
                logo: logoFile,
            });

            const added = Array.isArray(result) ? result[0] : result;

            if (added?.id) {
                setCompanies((prevCompanies) => [...prevCompanies, added]);

                setSubmitStatus({
                    success: true,
                    message: "✅ Company added successfully!",
                });

                reset({ name: "", logo: undefined });

                setTimeout(() => setOpen(false), 1000);
            }
        } catch (err) {
            setSubmitStatus({
                success: false,
                message: err.message || "Failed to add company",
            });
        }
    };

    useEffect(() => {
        if (!open) {
            reset();
            setSubmitStatus({ success: false, message: "" });
        }
    }, [open, reset]);

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button
                    type="button"
                    className="w-full sm:w-auto bg-black text-white hover:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    Add Company
                </Button>
            </DrawerTrigger>
            <DrawerContent onClick={(e) => e.stopPropagation()}>
                <DrawerHeader>
                    <DrawerTitle>Add a New Company</DrawerTitle>
                </DrawerHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(onSubmit)(e);
                    }}
                    className="flex flex-col gap-4 p-4 pb-0"
                    noValidate
                >
                    <div className="space-y-2">
                        <Input
                            placeholder="Company name"
                            {...register("name")}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Input
                            type="file"
                            accept="image/*"
                            className="file:text-gray-500"
                            {...register("logo")}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {errors.logo && (
                            <p className="text-red-500 text-sm">{errors.logo.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="destructive"
                        className="w-full"
                        disabled={loading || !isValid}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading ? "Adding..." : "Add Company"}
                    </Button>
                </form>
                <DrawerFooter className="flex flex-col gap-2">
                    {loading && (
                        <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />
                    )}
                    {submitStatus.message && (
                        <p
                            className={`text-center font-medium ${
                                submitStatus.success ? "text-green-600" : "text-red-500"
                            }`}
                        >
                            {submitStatus.message}
                        </p>
                    )}
                    <DrawerClose asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Cancel
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default AddCompanyDrawer;
