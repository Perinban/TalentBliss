import { useCallback, useRef, useState } from "react";

const useFetch = (callback, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(null);
  const callbackRef = useRef(callback);
  const optionsRef = useRef(options);
  callbackRef.current = callback;
  optionsRef.current = options;

  const fn = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callbackRef.current(optionsRef.current, ...args);
      if (response === undefined) throw new Error("No response received");
      setData(response);
      setTotalItems(
        response && typeof response === "object" && "total" in response ? response.total : null,
      );
      return response;
    } catch (requestError) {
      console.error("Request error:", requestError);
      setError(requestError);
      setData(null);
      setTotalItems(null);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fn, data, loading, error, totalItems };
};

export default useFetch;
