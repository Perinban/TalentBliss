import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCompanies } from "@/api/apiCompanies";

const CompaniesContext = createContext(null);

export const useCompanies = () => {
  const context = useContext(CompaniesContext);
  if (!context) throw new Error("useCompanies must be used within a CompaniesProvider");
  return context;
};

export const CompaniesProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCompanies();
      setCompanies(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  const value = useMemo(
    () => ({ companies, loading, error, setCompanies, refreshCompanies }),
    [companies, loading, error, refreshCompanies],
  );

  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
};
