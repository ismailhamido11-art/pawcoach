# Fix Requirements — PawCoach v9.0

**Date:** 2026-03-27
**Source:** SYNTHESIS-REPORT.md (76 findings from 9 audit reports)
**Format:** FIX-XX per requirement, grouped by fix phase

---

## Phase 6: Legal & Security (P0 — Blocks Launch)

### Legal Compliance

- [ ] FIX-01: **Privacy Policy page** — Create `/Privacy` route with RGPD-compliant privacy policy text. Add links in: SettingsSection, Onboarding footer, Premium footer. Must mention: data collected, purpose, retention, rights (access, delete, export, portability), contact DPO. [F-01]

- [ ] FIX-02: **Terms of Service page** — Create `/Terms` route with CGU/CGV text. Required for Stripe paid subscriptions. Add links same locations as FIX-01. [F-02]

- [ ] FIX-03: **Consent banner / analytics gate** — Add consent mechanism before `trackEvent()` fires. Either: (a) consent banner on first visit with accept/reject, or (b) remove analytics tracking entirely until real service is integrated. Must comply with ePrivacy Directive. [F-03]

- [ ] FIX-04: **GDPR consent at signup** — Add consent checkbox in Onboarding before Dog.create(): "J'accepte la politique de confidentialite et les conditions d'utilisation" with links. Block profile creation if unchecked. [F-04]

- [ ] FIX-05: **Data export (GDPR portability)** — Add "Exporter mes donnees" button in SettingsSection. Must export all user data (dogs, health records, daily logs, checkins, scans, bookmarks) as JSON or CSV. GDPR Art 20. [F-05]

- [ ] FIX-06: **Auto-renewal disclosure** — Add text near subscribe CTA in Premium.jsx: "Abonnement renouvele automatiquement. Resiliation a tout moment." Also add on annual plan: "Facturation annuelle de 59.99 EUR." EU Consumer Rights Directive. [F-06]

- [ ] FIX-07: **Medical disclaimer consistency** — Add veterinary disclaimer banner on DiagnosisContent (Sante > Symptomes tab) and preDiagnosis results. Match existing disclaimers in Home, Chat, FindVet, DownloadHealthPDF. [F-07]

- [ ] FIX-08: **Age verification consideration** — Add age acknowledgment in Onboarding: "Je confirme avoir 16 ans ou plus" or "J'ai l'autorisation parentale". GDPR Art 8. [F-08]

### Security

- [ ] FIX-09: **Content Security Policy** — Add CSP meta tag in index.html. At minimum: `default-src 'self'; script-src 'self' https://api.base44.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';` Adjust for Base44 SDK and Stripe. [F-15]

- [ ] FIX-10: **Backend input validation** — Add input length validation on pawcoachChat, preDiagnosis, and processHealthInput backend functions. Max 2000 chars for user text input. Strip HTML tags. Mitigate prompt injection. [F-16]

---

## Phase 7: Flow Fixes (P0/P1 — Runtime Breaks)

### Ruptures (P0)

- [ ] FIX-15: **VetNoteForm API call fix** — Change `base44.functions.vetAccess({...})` to `base44.functions.invoke("vetAccess", {...})` in VetNoteForm.jsx:30. Currently causes TypeError, vet notes NEVER submit. [F-09]

- [ ] FIX-16: **WalkReminderSettings error handling** — Wrap `onSave()` calls in handleToggle and handleTimeChange with try/catch. On error: rollback state (`setEnabled(prev)` / `setTime(prev)`), show toast.error. [F-10]

- [ ] FIX-17: **NotebookContent ge-* pseudo-record guard** — In handleDelete, add guard: `if (id.startsWith("ge-")) return;` alongside existing `dl-` guard. Prevents invalid HealthRecord.delete() call on GrowthEntry pseudo-records. [F-11]

- [ ] FIX-18: **Activite refreshLogs try/catch** — Wrap DailyLog.filter in refreshLogs with try/catch. On error: toast.error, don't crash PullToRefresh. [F-12]

- [ ] FIX-19: **Library handleActivateTraining try/catch** — Wrap JSON.parse(bk.content) in try/catch. On parse error: toast.error("Programme corrompu"), return early. [F-13]

- [ ] FIX-20: **LabelScanMode resetLabel parent sync** — Add `onLabelResult?.(null)` in resetLabel() function to inform Scan.jsx parent. Otherwise ModeSwitcher stays hidden after "Nouvelle analyse". [F-14]

### Critical Suspects (P1)

- [ ] FIX-21: **Dashboard Promise.all individual protection** — Add `.catch(() => [])` on HealthRecord.filter, DailyCheckin.filter, Streak.filter, UserProgress.filter, DailyLog.filter (5 calls currently unprotected). One failure should not blank the entire Dashboard. [F-62]

- [ ] FIX-22: **Home background refresh indicator** — When background refresh fails silently (fetchAndCache(true) catch), show subtle indicator or stale-data badge so user knows data may be outdated. [F-73]

- [ ] FIX-23: **Quick check-in id guard** — If `result.checkin` is absent from API response, either reject with toast or re-fetch the checkin from DB instead of using a fallback object without `id` field. [F-74]

- [ ] FIX-24: **NutriCoach 429 toast** — When pawcoachChat returns quota_exceeded (429), show toast.error("Limite de messages atteinte") instead of silently setting messagesRemaining to 0. [F-75]

- [ ] FIX-25: **Chat suggestions disable during loading** — Add `disabled={loading}` or `pointer-events-none` on suggestion chips during sendMessage execution. Prevents double-tap sending 2 messages. [F-76]

- [ ] FIX-26: **Sante dog weight sync after SectionPoids** — After SectionPoids adds a weight, update dog state in Sante.jsx (setDog(prev => ({...prev, weight: w}))). Currently dog.weight is stale until page reload. [F-77]

- [ ] FIX-27: **DogProfile export revokeObjectURL timing** — Replace immediate `URL.revokeObjectURL(url)` with `setTimeout(() => URL.revokeObjectURL(url), 5000)` to avoid race condition on mobile browsers. [F-78]

---

## Phase 8: UX & Activation (P1 — Before Launch)

### Onboarding

- [ ] FIX-31: **Onboarding simplification to 5-6 steps** — Consolidate: (1) Goal, (2) Name + Photo, (3) Breed + Age, (4) Sex + Weight + Activity, (5) Environment + Health. Add breed-specific preview between steps 3 and 4: "Pour un [race] de [age], voici ce qu'on va suivre." Target: 2 minutes max. [F-20]

- [ ] FIX-32: **Quick start option** — Add "Remplir plus tard" link at step 2+ that creates a minimal dog profile (name only) and skips to Home. Let user complete profile from DogProfile later. [F-34]

### AI Visibility

- [ ] FIX-33: **AI Chat on Home** — Add a "Parle au coach IA" card in Home feed (below DailyBriefing) or make ChatFAB visible on Home alongside CombinedFAB. The AI differentiator must be discoverable by new users on their first visit. [F-21]

### Navigation

- [ ] FIX-34: **Sub-tab scroll indicator** — Add gradient edge (fade-to-background) on right side of tab bars in Sante, Nutri, Activite to indicate more tabs are available via horizontal scroll. CSS-only solution preferred. [F-24]

- [ ] FIX-35: **Find Vet shortcut** — Add "Trouver un veto" in Home quick actions or as a prominent link in DailyBriefing when health concern is detected. Reduce 3+ taps to 1-2 for urgent vet search. [F-26]

- [ ] FIX-36: **Dashboard prominence** — Either move Dashboard link higher in Home (above quick actions) or add a prominent "Bilan sante" section in Home feed. [F-28]

### WelcomeScreen

- [ ] FIX-37: **Personalized WelcomeScreen** — After onboarding, show 2-3 breed/age-specific phrases: "Pour un [race] de [age], on va suivre [X], [Y], et [Z]." Use the data collected during onboarding to make the welcome meaningful. [F-27]

### Chat Transparency

- [ ] FIX-38: **AI message counter in Chat header** — Display "X messages restants aujourd'hui" (for free users) in the Chat page header. Makes the limit transparent and encourages upgrade before frustration. [F-29]

### PWA Completeness

- [ ] FIX-39: **Offline banner** — Add global "Vous etes hors ligne" banner using `navigator.onLine` + `online`/`offline` events. Show at top of Layout when offline, hide when back online. [F-36]

- [ ] FIX-40: **SW update prompt** — In main.jsx SW registration, check for updates and show "Nouvelle version disponible — Recharger" toast. Replace skipWaiting() with user-prompted update. [F-37]

- [ ] FIX-41: **Stripe portal loading state** — Add loading spinner in SubscriptionSection when "Gerer mon abonnement" is clicked, before Stripe portal redirect. [F-38]

---

## Phase 9: Visual Polish & Consistency (P2 — Quality)

### Charte Violations

- [ ] FIX-44: **Orange cleanup (9 files)** — Replace all `text-orange-*`, `bg-orange-*`, `border-orange-*` classes with amber or emerald alternatives in: badgeUtils.jsx, DogTrophiesRow.jsx, AchievementsSection.jsx, CoachSettings.jsx, InlineCheckin.jsx, StreakBar.jsx, EmotionalTip.jsx, DiagnosisContent.jsx, TrackerHistory.jsx. [F-48]

- [ ] FIX-45: **Yellow cleanup (2 files)** — Replace `text-yellow-*`, `bg-yellow-*` with amber in AITrainingProgram.jsx and NearbyParks.jsx. [F-48]

- [ ] FIX-46: **Sante.jsx gradient fixes** — Replace `from-teal-50/50` (line 214) with cream/emerald. Replace `from-red-50 to-orange-50/50` (line 256) with red-50 to amber-50/50. [F-49]

### Spacing Consistency

- [ ] FIX-47: **Standardize page padding to px-5** — Ensure all page-level content uses `px-5` (20px) consistently. Fix Sante tab content from px-4 to px-5. Audit Dashboard, Profile, Home for alignment. [F-50]

- [ ] FIX-48: **Standardize section spacing** — Pick one rhythm (space-y-5) for inter-section spacing across Home, Dashboard, Profile. Currently mixed: space-y-4, space-y-5, space-y-6. [F-56]

### Typography

- [ ] FIX-49: **Rationalize custom font sizes** — Map inline pixel sizes to a 3-tier sub-scale: caption (10-11px -> text-[11px]), detail (12-13px -> text-xs), body (14-15px -> text-sm). Reduce 6 custom sizes to 3. [F-51]

### Animation Consistency

- [ ] FIX-50: **Import animation presets** — Replace inline spring values (stiffness:500/damping:35 in Sante, stiffness:400/damping:30 in BottomNav) with named presets from animations.js. Add `springFast` or `springTab` preset if different values are intentional. [F-52]

- [ ] FIX-51: **Centralize stagger delays** — Define stagger delay in animations.js (e.g., `staggerDelay: 0.06`) and import in Dashboard, Profile, Premium instead of hardcoding 0.05/0.07. [F-53]

### PWA Icons

- [ ] FIX-52: **PNG icons for manifest** — Generate 192x192 and 512x512 PNG versions of the app icon. Add to manifest.json alongside existing SVG. Required for older Android browsers. [F-57]

- [ ] FIX-53: **apple-touch-icon PNG** — Replace JPG apple-touch-icon in index.html with a proper PNG (180x180 recommended for iOS). [F-58]

### Cleanup

- [ ] FIX-54: **Remove ReferralSection import** — Remove dead import of ReferralSection from Profile.jsx (component returns null). [F-70, F-42]

- [ ] FIX-55: **Update version number** — Either dynamically set version from package.json or update hardcoded "1.0.0" in SettingsSection.jsx to current version. [F-43]

- [ ] FIX-56: **Hardcoded hex colors to tokens** — Replace hardcoded hex colors (#8b5cf6, #ec4899, #3b82f6) in Dashboard.jsx stat cards and Premium.jsx features with design token classes. [F-55]

- [ ] FIX-57: **Reduced motion gaps** — Add `useReducedMotion()` check in Profile.jsx, Premium.jsx, DogProfile.jsx, Onboarding.jsx. Disable Framer Motion animations when OS preference is set. [F-71]

---

## Phase 10: Performance & Architecture (P2/P3 — Post-Launch)

### Complexity Reduction

- [ ] FIX-59: **Decompose buildHealthSummaryHTML** — Break the 28-complexity function into sub-functions: buildVaccineSection(), buildWeightSection(), buildAlertsSection(), etc. Target: max 10 cyclomatic complexity per function. [F-59]

- [ ] FIX-60: **Factor getAge into shared util** — Create `base44/functions/_shared/dateUtils.ts` with a single getAge() implementation. Import in pawcoachChat and weeklyInsightGenerate instead of duplicating. [F-60]

- [ ] FIX-61: **Audit handleDownload** — Investigate the function with 50 outgoing calls. Identify responsibilities and decompose into smaller focused functions. [F-61]

### Data Architecture

- [ ] FIX-62: **Shared DogContext** — Create a DogContext or upgrade HomeCacheContext to AppCacheContext. Share dog data across pages instead of each page independently calling Dog.filter(). [F-63]

- [ ] FIX-63: **Home useHomeData hook** — Extract fetchDogData + fetchAndCache + cache logic from Home.jsx into a custom `useHomeData()` hook. Reduce Home.jsx God Page pattern. [F-65]

- [ ] FIX-64: **Nutri useReducer migration** — Replace dogDataState (10 fields + 10 setters) with useReducer in Nutri.jsx. Cleaner state management. [F-66]

### Backend Optimization

- [ ] FIX-65: **VetPortal batch query** — Replace N+1 getDogData calls in VetPortal.loadAccesses with a batch query or a dedicated "listMyPatients" backend function. [F-64]

### Dead Code Verification

- [ ] FIX-66: **Verify verdictFr in pawcoachChat** — Check if used in local scope. If dead, remove. [F-67]

- [ ] FIX-67: **Verify backend sanitize/validateImageUrl** — These are flagged dead by CGC but likely used in local scope of each Deno function. Verify each instance, document or remove. [F-69]

- [ ] FIX-68: **Analytics decision** — Either integrate a real analytics service (Mixpanel, Amplitude, PostHog) or remove the localStorage-only trackEvent() system. Current state is a placeholder that generates no insights. [F-72]

---

## Summary

| Phase | Requirements | P0 | P1 | P2 | P3 |
|-------|-------------|----|----|----|----|
| 6 — Legal & Security | FIX-01 to FIX-10 | 8 | 2 | 0 | 0 |
| 7 — Flow Fixes | FIX-15 to FIX-27 | 6 | 7 | 0 | 0 |
| 8 — UX & Activation | FIX-31 to FIX-41 | 2 | 9 | 0 | 0 |
| 9 — Visual Polish | FIX-44 to FIX-57 | 0 | 2 | 12 | 0 |
| 10 — Performance | FIX-59 to FIX-68 | 0 | 0 | 7 | 3 |
| **Total** | **58 requirements** | **16** | **20** | **19** | **3** |

---

*Requirements generated: 2026-03-27. Mapped from SYNTHESIS-REPORT.md findings F-01 through F-78.*
