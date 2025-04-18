import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { MapPinIcon, Trash2Icon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { BarLoader } from "react-spinners";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { saveJob, deleteJob } from "@/api/apiJobs.js";

const JobCard = ({
                     job,
                     isMyJob = false,
                     savedInit = false,
                     onJobSaved = () => {},
                 }) => {
    const [saved, setSaved] = useState(savedInit);
    const { user } = useUser();

    const {
        fn: saveJobFn,
        data: savedJob,
        loading: saving,
    } = useFetch(saveJob, { alreadySaved: saved });

    const {
        fn: deleteJobFn,
        loading: deleting,
    } = useFetch(deleteJob, { job_id: job.id });

    const handleSaveJob = useCallback(async () => {
        if (!saving) {
            await saveJobFn({ user_id: user.id, job_id: job.id });
            onJobSaved();
        }
    }, [saving, saveJobFn, user.id, job.id, onJobSaved]);

    const handleDeleteJob = useCallback(async () => {
        if (!deleting) {
            await deleteJobFn();
            onJobSaved();
        }
    }, [deleting, deleteJobFn, onJobSaved]);

    useEffect(() => {
        if (savedJob !== undefined) {
            setSaved(savedJob?.length > 0);
        }
    }, [savedJob]);

    const loading = saving || deleting;
    const jobIntro = job.description?.split(".")[0] || "";

    return (
        <Card className="flex flex-col h-full min-h-[380px] justify-between p-4">
            {loading && <BarLoader className="mt-4" width="100%" color="#36d7b7" />}

            {/* HEADER */}
            <CardHeader className="relative px-4 pt-4 pb-2 min-h-[64px]">
                <CardTitle className="flex justify-between items-start w-full gap-4">
          <span className="text-lg font-semibold line-clamp-2 leading-tight">
            {job.title}
          </span>
                    {isMyJob && (
                        <Trash2Icon
                            fill="red"
                            size={20}
                            className="text-red-300 cursor-pointer absolute top-2 right-2"
                            onClick={handleDeleteJob}
                        />
                    )}
                </CardTitle>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="flex flex-col px-4 gap-4 flex-grow">
                {/* Company + Location Row (Fixed Height) */}
                <div className="flex justify-between items-center min-h-[36px]">
                    {job.company?.logo_url ? (
                        <img
                            src={job.company.logo_url}
                            alt="logo"
                            className="h-8 max-w-[100px] object-contain"
                        />
                    ) : (
                        <div className="h-8 w-[100px]" /> // Placeholder to keep height
                    )}
                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                        <MapPinIcon size={15} /> {job.country}
                    </div>
                </div>

                {/* Divider */}
                <hr />

                {/* Job Description (Fixed Height) */}
                <p className="text-base text-muted-foreground line-clamp-5 min-h-[90px]">
                    {jobIntro}
                </p>
            </CardContent>

            {/* FOOTER */}
            <CardFooter className="flex gap-2 px-4 py-4 mt-auto">
                <Link to={`/job/${job.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                        More Details
                    </Button>
                </Link>

                {!isMyJob && (
                    <Button
                        variant="outline"
                        className="w-15"
                        onClick={handleSaveJob}
                        disabled={saving}
                    >
                        <Heart
                            size={20}
                            stroke="red"
                            fill={saved ? "red" : "none"}
                        />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default React.memo(JobCard);