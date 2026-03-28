import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * useTabNavigation — shared tab navigation logic with URL sync + sessionStorage persistence.
 *
 * @param {Array<{id: string}>} tabs - Tab config array (each must have an `id`)
 * @param {string} pageName - Key for sessionStorage (e.g. "Activite", "Nutri", "Sante")
 * @param {object} [options]
 * @param {string} [options.defaultTab] - Default tab id (defaults to first tab)
 * @param {(urlTab: string|null) => string|null} [options.resolveDeepLink] -
 *   If present, called with urlTab before standard resolution.
 *   Return a tab id to force that tab (deep link), or null to fall through to normal logic.
 * @returns {{ activeTab: string, tabDir: number, changeTab: (id: string) => void, searchParams: URLSearchParams }}
 */
export default function useTabNavigation(tabs, pageName, options = {}) {
  const { defaultTab = tabs[0]?.id, resolveDeepLink } = options;
  const storageKey = `tab_${pageName}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");

  // Deep link resolution (e.g. Sante sub-tabs)
  const deepLinkedTab = resolveDeepLink ? resolveDeepLink(urlTab) : null;

  // Priority: deep link > URL param (if valid tab) > sessionStorage > default
  const activeTab = deepLinkedTab
    ? deepLinkedTab
    : (urlTab && tabs.some(t => t.id === urlTab))
      ? urlTab
      : (() => {
          const stored = sessionStorage.getItem(storageKey);
          return (stored && tabs.some(t => t.id === stored)) ? stored : defaultTab;
        })();

  // On mount without URL param, sync URL with preserved tab (replace, not push)
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      if (!deepLinkedTab && !urlTab && activeTab !== defaultTab) {
        setSearchParams({ tab: activeTab }, { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  const changeTab = (tabId) => {
    sessionStorage.setItem(storageKey, tabId);
    setSearchParams({ tab: tabId });
  };

  // Track direction for native-like horizontal slide animation
  const tabIndex = tabs.findIndex(t => t.id === activeTab);
  const prevTabIdx = useRef(tabIndex);
  const tabDir = tabIndex >= prevTabIdx.current ? 1 : -1;
  useEffect(() => { prevTabIdx.current = tabIndex; }, [tabIndex]);

  return { activeTab, tabDir, changeTab, searchParams };
}

/** Shared animation variants for tab content transitions */
export const tabVariants = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};
