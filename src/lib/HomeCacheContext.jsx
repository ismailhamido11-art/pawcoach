import { createContext, useContext, useEffect, useRef } from "react";

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

const HomeCacheContext = createContext(null);

export function HomeCacheProvider({ children }) {
  const cacheRef = useRef(null);

  useEffect(() => {
    const handleLogout = () => { cacheRef.current = null; };
    window.addEventListener("pawcoach:logout", handleLogout);
    return () => window.removeEventListener("pawcoach:logout", handleLogout);
  }, []);

  const getCachedHome = () => {
    if (!cacheRef.current) return null;
    // Invalidate if active dog changed since cache was written
    const currentDogId = localStorage.getItem("activeDogId");
    if (currentDogId && cacheRef.current.dogId !== currentDogId) return null;
    const isFresh = Date.now() - cacheRef.current.timestamp < CACHE_TTL;
    return { ...cacheRef.current, isFresh };
  };

  const setCachedHome = (data) => {
    cacheRef.current = {
      user: data.user,
      userId: data.user?.id || null,
      dog: data.dog,
      dogId: data.dog?.id || null,
      dogData: data.dogData,
      insights: data.insights,
      timestamp: Date.now(),
    };
  };

  const invalidateHome = () => {
    cacheRef.current = null;
  };

  return (
    <HomeCacheContext.Provider value={{ getCachedHome, setCachedHome, invalidateHome }}>
      {children}
    </HomeCacheContext.Provider>
  );
}

export function useHomeCache() {
  const ctx = useContext(HomeCacheContext);
  if (!ctx) throw new Error("useHomeCache must be used within HomeCacheProvider");
  return ctx;
}
