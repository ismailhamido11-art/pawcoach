# Phase 4 — Home Cache — CONTEXT

## Decision 1: Cache strategy
**Choice**: Stale-while-revalidate — show cached data immediately, refresh in background
**Why**: Best UX — user never sees loading screen on return visits. Instagram/TikTok pattern.

## Decision 2: Technical approach
**Choice**: Simple React context + sessionStorage (no external library)
**Why**: PawCoach doesn't need react-query complexity. A HomeCacheContext with timestamp is sufficient.

## Decision 3: Cache duration
**Choice**: Cache valid for 2 minutes. After that, background refresh on next visit.
**Why**: Dog health data doesn't change every second. 2 min is safe.

## Decision 4: Pull-to-refresh
**Choice**: Keep existing pull-to-refresh — it forces a full refresh (bypasses cache)
**Why**: User control. They can always get fresh data.

## Decision 5: Scope
**Choice**: Only cache the Home page data (fetchDogData + loadInsights). Don't touch other pages.
**Why**: Minimize risk. Home is the bottleneck (11 API calls). Other pages have 1-3 calls max.

## Constraints
- Do NOT modify the data flow inside components (they receive props the same way)
- Do NOT add new npm dependencies
- Do NOT change the visual layout
- Build must pass
- Pull-to-refresh must still work
