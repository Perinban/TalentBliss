import { useSession } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

const useFetch = (cb, options = {}) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [totalItems, setTotalItems] = useState(null);

    const { session, isLoaded } = useSession();

    const fn = async (...args) => {
        if (!isLoaded || !session) {
            setError("Session is not loaded or not available.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabaseAccessToken = await session.getToken({
                template: "jobportaldb",
            });

            const response = await cb(supabaseAccessToken, options, ...args);

            if (!response) {
                throw new Error("No response received");
            }

            if (typeof response === "object") {
                if ("jobs" in response) {
                    setData(response.jobs);
                    setTotalItems(response.total || null);
                } else if ("data" in response) {
                    setData(response.data);
                    setTotalItems(response.total || null);
                } else {
                    setData(response);
                }
            } else {
                setData(response);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setError(error.message || "Failed to fetch data");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoaded || !session) {
            return;
        }
    }, [isLoaded, session]);

    return { fn, data, loading, error, totalItems };
};

export default useFetch;