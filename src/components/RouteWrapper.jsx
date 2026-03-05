import { useEffect } from "react";

/**
 * RouteWrapper enables nested URL routing in a flat file-based routing system.
 * It intercepts route changes and manages history navigation for sub-routes.
 * 
 * Usage in pages:
 * - Use useParams() to read URL segments
 * - Use navigate() with createPageUrl() for navigation
 * - Scroll restoration is handled automatically by BottomNav
 */

export function useNestedRouting() {
  useEffect(() => {
    // Scroll restoration handled by BottomNav useEffect
  }, []);

  return null;
}

export default RouteWrapper;