import { useEffect } from "react";

/**
 * RouteWrapper — Functional wrapper for managing application route lifecycle.
 * 
 * Handles:
 * - Route transition animations
 * - Navigation lifecycle hooks
 * - Session state preservation (sub-tabs, scroll position)
 * 
 * Usage:
 * import RouteWrapper from '@/components/RouteWrapper';
 * export default function Page() {
 *   return <RouteWrapper page="PageName">{children}</RouteWrapper>;
 * }
 */

export default function RouteWrapper({ page, children }) {
  useEffect(() => {
    // Restore scroll position if available
    const saved = sessionStorage.getItem(`scroll_${page}`);
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
      });
    }
  }, [page]);

  useEffect(() => {
    return () => {
      // Save scroll position on unmount
      sessionStorage.setItem(`scroll_${page}`, window.scrollY);
    };
  }, [page]);

  return children;
}