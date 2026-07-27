import { useState } from "react";
import { Boxes, BriefcaseBusiness, Download, School } from "lucide-react";
import { updateApplicationStatus } from "@/api/apiApplications";
import { assetUrl } from "@/api/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { BarLoader } from "react-spinners";
import useFetch from "@/hooks/use-fetch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ApplicationCard = ({ application, isCandidate = false }) => {
  const [status, setStatus] = useState(application.status);
  const { loading, fn: updateStatus } = useFetch(updateApplicationStatus, {
    application_id: application.id,
  });

  const handleDownload = () => {
    window.open(assetUrl(application.resume), "_blank", "noopener,noreferrer");
  };

  const handleStatusChange = async (nextStatus) => {
    const updated = await updateStatus(nextStatus);
    if (updated?.status) setStatus(updated.status);
  };

  return (
    <Card className="mb-10">
      {loading && <BarLoader width="100%" color="#36d7b7" />}
      <CardHeader>
        <CardTitle className="flex justify-between font-bold">
          {isCandidate
            ? application.job?.title + " at " + application.job?.company?.name
            : application.first_name + " " + application.last_name}
          <Download
            size={18}
            className="h-8 w-8 cursor-pointer rounded-full bg-white p-1.5 text-black"
            onClick={handleDownload}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col justify-between md:flex-row">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={15} /> {application.experience_years} years of experience
          </div>
          <div className="flex items-center gap-2">
            <School size={15} /> {application.higher_education}
          </div>
          <div className="flex items-center gap-2">
            <Boxes size={15} /> Skills: {application.skills}
          </div>
        </div>
        <hr />
      </CardContent>
      <CardFooter className="flex justify-between">
        <span>{new Date(application.created_at).toLocaleString()}</span>
        {isCandidate ? (
          <span className="font-bold capitalize">Status: {status}</span>
        ) : (
          <Select onValueChange={handleStatusChange} value={status}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Application Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;
