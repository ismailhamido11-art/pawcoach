# Phase 1: Security Fixes - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Eliminer les failles de securite identifiees par l'audit du 28 mars 2026 :
1. Secret HMAC en dur dans preDiagnosis + finalDiagnosis (fallback string public sur GitHub)
2. Liens Privacy Policy et Terms manquants dans le footer de Premium.jsx

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/security phase.

</decisions>

<code_context>
## Existing Code Insights

### Files to modify
- `base44/functions/preDiagnosis/entry.ts:145` — `Deno.env.get("PRE_DIAG_SECRET") || "pawcoach-diag-secret-v1"`
- `base44/functions/finalDiagnosis/entry.ts:49` — same pattern
- `src/pages/Premium.jsx` — footer section missing Privacy/Terms links

### Existing patterns
- Privacy.jsx and Terms.jsx pages already exist with full content
- createPageUrl("Privacy") and createPageUrl("Terms") are the navigation patterns used

</code_context>

<specifics>
## Specific Ideas

- Remove fallback strings, throw error 500 if env var missing
- Add links matching the style of existing footer elements

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
