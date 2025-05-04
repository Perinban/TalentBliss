import { useUser } from "@clerk/clerk-react";
import ApplicationCard from "./application-card";
import { useEffect } from "react";
import { getApplications } from "@/api/apiApplications";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { HeartCrack } from "lucide-react";

const CreatedApplications = () => {
    const { user } = useUser();

    const {
        loading: loadingApplications,
        data: applications,
        fn: fnApplications,
    } = useFetch(getApplications, {
        user_id: user.id,
    });

    useEffect(() => {
        fnApplications();
    }, []);

    if (loadingApplications) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    if (!applications || applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-16 text-gray-600">
                <HeartCrack size={48} className="mb-4 text-red-400" />
                <h2 className="text-2xl font-semibold mb-2">No Applications Yet</h2>
                <p className="text-sm text-gray-500">
                    The jobs you apply to will appear here.
                </p>
            </div>
        );
    } else {
        return (

            <div className="flex flex-col gap-2">

                <h1 className="gradient-title font-extrabold text-3xl sm:text-5xl text-center pb-8">
                    My Applications
                </h1>

                {applications.map((application) => {
                    return (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            isCandidate={true}
                        />
                    );
                })}
            </div>
        );
    }
};

export default CreatedApplications;