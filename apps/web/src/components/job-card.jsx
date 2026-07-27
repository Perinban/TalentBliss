import React, { useCallback, useEffect, useState } from "react";
import { Heart, MapPinIcon, Trash2Icon } from "lucide-react";
import { BarLoader } from "react-spinners";
import { assetUrl } from "@/api/client.js";
import { deleteJob, saveJob } from "@/api/apiJobs.js";
import { useUser } from "@/auth/auth-context";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { Link } from "@/routing";

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

  const { fn: deleteJobFn, loading: deleting } = useFetch(deleteJob, {
    job_id: job.id,
  });

  const handleSaveJob = useCallback(async () => {
    if (!saving && user?.role === "candidate") {
      await saveJobFn({ job_id: job.id });
      onJobSaved();
    }
  }, [saving, saveJobFn, user?.role, job.id, onJobSaved]);

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
    <Card className="flex h-full min-h-[380px] flex-col justify-between p-4">
      {loading && <BarLoader className="mt-4" width="100%" color="#36d7b7" />}

      <CardHeader className="relative min-h-[64px] px-4 pb-2 pt-4">
        <CardTitle className="flex w-full items-start justify-between gap-4">
          <span className="line-clamp-2 text-lg font-semibold leading-tight">
            {job.title}
          </span>
          {isMyJob && (
            <Trash2Icon
              fill="red"
              size={20}
              className="absolute right-2 top-2 cursor-pointer text-red-300"
              onClick={handleDeleteJob}
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-grow flex-col gap-4 px-4">
        <div className="flex min-h-[36px] items-center justify-between">
          {job.company?.logo_url ? (
            <img
              src={assetUrl(job.company.logo_url)}
              alt="logo"
              className="h-8 max-w-[100px] object-contain"
            />
          ) : (
            <div className="h-8 w-[100px]" />
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon size={15} />
            {job.country}
          </div>
        </div>

        <hr />

        <p className="line-clamp-5 min-h-[90px] text-base text-muted-foreground">
          {jobIntro}
        </p>
      </CardContent>

      <CardFooter className="mt-auto flex gap-2 px-4 py-4">
        <Link to={`/job/${job.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            More Details
          </Button>
        </Link>

        {!isMyJob && user?.role === "candidate" && (
          <Button
            variant="outline"
            className="w-15"
            onClick={handleSaveJob}
            disabled={saving}
          >
            <Heart size={20} stroke="red" fill={saved ? "red" : "none"} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default React.memo(JobCard);
