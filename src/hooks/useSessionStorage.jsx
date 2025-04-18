import { useState, useEffect } from "react";

const useSessionStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("Session storage error:", error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error("Failed to save to session storage:", error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

export default useSessionStorage;