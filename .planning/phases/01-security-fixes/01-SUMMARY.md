# Phase 1: Security Fixes — Summary
**Status:** Complete
**Commits:** dbf2798
**Requirements:** SEC-01 ✅, SEC-02 ✅
## What shipped
- Removed HMAC fallback secret from preDiagnosis + finalDiagnosis (throws 500 if env var missing)
- Added Privacy Policy and Terms links to Premium.jsx footer (both trial and standard views)
- Added Link import to Premium.jsx
