import { createContext, useContext, useRef } from "react";

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes in ms

const HomeCacheContext = createContext(null);

/**
 * HomeCacheProvider — stale-while-revalidate cache for Home page data.
 * Stores raw API results in a ref (no re-renders on cache writes).
 * Cache is in-memory only (cleared on full page reload), per sessionStorage decision.
 */
export function HomeCacheProvider({ children }) {
  // Using a ref so cache reads/writes don't trigger re-renders
  const cacheRef = useRef(null);

  /**
   * Returns cached data if it exists, regardless of freshness.
   * Caller decides what to do based on isFresh.
   * @returns {{ user, dog, dogData, insights, timestamp, isFresh } | null}
   */
  const getCachedHome = () => {
    if (!cacheRef.current) return null;
    const { timestamp } = cacheRef.current;
    const isFresh = Date.now() - timestamp < CACHE_TTL;
    return { ...cacheRef.current, isFresh };
  };

  /**
   * Stores fetched data in the cache with the current timestamp.
   * @param {{ user, dog, dogData, insights }} data
   */
  const setCachedHome = (data) => {
    cacheRef.current = {
      user: data.user,
      dog: data.dog,
      dogData: data.dogData,
      insights: data.insights,
      timestamp: Date.now(),
    };
  };

  /**
   * Clears the cache. Call on pull-to-refresh so next load is always fresh.
   */
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
  if (!ctx) {
    throw new Error("useHomeCache must be used within a HomeCacheProvider");
  }
  return ctx;
}
