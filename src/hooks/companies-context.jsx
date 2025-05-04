import React, { createContext, useState, useEffect, useContext } from "react";
import { getCompanies } from "@/api/apiCompanies";
import { useUser } from "@clerk/clerk-react";

// Create the context
const CompaniesContext = createContext({
    companies: [],
    loading: false,
    error: null,
    setCompanies: () => {},
});

// Custom hook to use the CompaniesContext
export const useCompanies = () => {
    const context = useContext(CompaniesContext);
    if (!context) {
        throw new Error("useCompanies must be used within a CompaniesProvider");
    }
    return context;
};

// Provider component to wrap the application with companies data
export const CompaniesProvider = ({ children }) => {
    const { user } = useUser();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch companies data only if user is authenticated
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const response = await getCompanies();
                if (Array.isArray(response)) {
                    setCompanies(response);
                } else {
                    setError("Unexpected response format from the server");
                }
            } catch (err) {
                console.error("Error fetching companies:", err);
                setError("Failed to fetch companies");
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [user]);

    // Context value
    const value = {
        companies,
        loading,
        error,
        setCompanies,
    };

    return (
        <CompaniesContext.Provider value={value}>
            {children}
        </CompaniesContext.Provider>
    );
};
