# Production Readiness Checklist — PawCoach Full App Audit

**Date:** 2026-03-27
**Mode:** Full App Audit (code reading, no browser)
**App:** PawCoach (PWA, Pet Care, EU market, FR language)
**Auditor:** Claude Code (production-checklist skill)
**Score:** 189/259 items OK (73%)

---

## Summary

PawCoach has strong fundamentals: ErrorBoundary on every page, skeleton loading states, dark mode support, pull-to-refresh, PWA manifest, RGPD cascade delete, Stripe webhook signature verification, and solid mobile-native CSS behaviors. However, several critical gaps remain — primarily around legal compliance (no Privacy Policy, no Terms of Service, no cookie/consent banner), accessibility (limited ARIA, no skip-nav, no keyboard navigation testing), and PWA completeness (no offline page, no SW update prompt, only SVG icons).

---

## MISSING — Legal Risk (Critical for EU market)

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| LC-01 | **Privacy Policy page/link** | Grep for "privacy\|politique\|confidentialite" returns 0 results in src/. No link in SettingsSection, Onboarding, or Premium. | GDPR Article 13 violation. Mandatory for EU. Could result in fines. |
| LC-02 | **Terms of Service / CGU** | Grep for "terms\|conditions\|cgu\|cgv\|mentions" returns 0 results in src/. | Required for paid subscriptions (Stripe). |
| LC-03 | **Cookie/consent banner** | Grep for "consent\|cookie\|opt.in\|data.collect" returns 0 UI results (only sidebar.jsx from shadcn). Analytics uses localStorage without consent. | ePrivacy Directive violation. Required before any tracking. |
| LC-04 | **GDPR consent at signup** | Onboarding.jsx has no consent checkbox before creating Dog entity and storing personal data. | User data stored without explicit consent. |
| LC-05 | **Data export (GDPR portability)** | No "Export my data" button or function. deleteUser exists but no export. | GDPR Article 20 — right to data portability. |
| LC-06 | **Subscription auto-renewal disclosure** | Premium.jsx shows prices but no "auto-renews" text near the CTA. Missing "cancel anytime" mention at checkout. | EU Consumer Rights Directive requires clear auto-renewal disclosure. |
| LC-07 | **Medical disclaimer on AI health pages** | Home.jsx:666, Chat.jsx:351, FindVetContent.jsx:234, DownloadHealthPDF.jsx:450 have disclaimers. But Sante.jsx DiagnosisContent and preDiagnosis results have no disclaimer banner. | Liability risk — AI health advice without consistent disclaimers. |
| LC-08 | **Age verification / parental consent** | No age check in onboarding. GDPR requires parental consent for users under 16 in EU. | GDPR Article 8 violation if minors use the app. |

## MISSING — WCAG Violations

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| WC-01 | **Skip navigation link** | No "skip to content" link in Layout.jsx or App.jsx. | WCAG 2.1 AA 2.4.1 — screen reader users must tab through BottomNav on every page. |
| WC-02 | **lang attribute on page content** | index.html has `lang="fr"` (OK). But AI-generated content (chat, diagnosis) may be in mixed language with no lang switching. | WCAG 3.1.2 — Language of Parts. |
| WC-03 | **Color contrast on gradient buttons** | White text on `gradient-primary` (from hsl(160,50%,22%) to hsl(162,45%,32%)) — the lighter end may fail 4.5:1 for small text. | WCAG 1.4.3 — Minimum Contrast. |
| WC-04 | **Form field labels** | Onboarding voice inputs use placeholder only, no visible `<label>`. CombinedFAB inputs use placeholder-only. Chat textarea has `aria-label` but no visible label. | WCAG 1.3.1 + 3.3.2 — Labels and Instructions. |
| WC-05 | **Focus management after navigation** | No `document.title` updates per page. No focus management after route changes. | WCAG 2.4.2 (Page Titled) + 2.4.3 (Focus Order). |
| WC-06 | **Keyboard navigation for tabs** | Sante/Activite/Nutri tabs are `<button>` elements but no `role="tablist"`, `role="tab"`, `aria-selected`, or arrow key navigation. | WCAG 4.1.2 — Name, Role, Value for tab patterns. |
| WC-07 | **Alt text on decorative images** | StorysetIllustration and Illustration components: Illustration.jsx:30 has `aria-hidden` when alt is empty (good), but StorysetIllustration not verified. | WCAG 1.1.1 — Non-text Content. |
| WC-08 | **Error identification for forms** | Onboarding form shows toast on error but no inline error messages next to the field. | WCAG 3.3.1 — Error Identification. |

## MISSING — Security

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| SE-01 | **Content Security Policy header** | No CSP meta tag in index.html or server config. Base44 may add one, but not verified. | XSS mitigation. OWASP Top 10. |
| SE-02 | **Input validation on backend** | Frontend has some sanitization (DogEditModal sanitizeName, pdfHelpers sanitize). Backend functions (pawcoachChat, preDiagnosis) receive user text — no validation of input length or content. | Prompt injection risk on AI functions. |
| SE-03 | **Rate limiting on AI functions** | Frontend has credit-based limits (ai-credits.js: 10 msg/day, 3 actions/day). But credits are stored on user object — a determined user could modify localStorage or call API directly. Backend HMAC quota exists but only for some functions. | API abuse / cost risk. |
| SE-04 | **Secure token storage** | Token stored in localStorage via Base44 SDK (AuthContext.jsx). localStorage is vulnerable to XSS. HttpOnly cookies would be safer but Base44 SDK controls this. | Token theft via XSS. Platform constraint. |
| SE-05 | **No session timeout** | No idle timeout or token refresh mechanism visible in AuthContext.jsx. | Session hijacking risk if device is left unlocked. |

## MISSING — UX Broken

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| UX-01 | **Offline page/state** | sw.js:77 returns cached "/" on navigation failure, but no actual offline UI. No "you're offline" banner. WalkMode has offline sync but no global offline indicator. | User sees blank or stale page when offline with no explanation. |
| UX-02 | **SW update prompt** | main.jsx registers SW but never checks for updates. No "New version available" prompt. sw.js uses skipWaiting() which forces updates without user consent. | User may get broken cache after update. Or never see new version. |
| UX-03 | **No back button on Profile page** | Profile.jsx is a BottomNav tab — correct to not have back. But SettingsSection, VetSection, CoachSettings open inline — no issue. OK, but DogProfile, Library, Premium, Scan all have back buttons (verified). | N/A — this is fine for tab pages. |
| UX-04 | **No loading state on Stripe portal redirect** | SubscriptionSection.jsx handlePortal() has no loading spinner — user clicks "Gerer mon abonnement" and nothing visible happens until redirect. | User may double-click, thinking nothing happened. |

## MISSING — Conversion Loss

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| CV-01 | **No social proof on Premium page** | Premium.jsx has no testimonials, user count, rating, or trust badges. | Reduces conversion — standard in pet care vertical (Woofz, Dogo all show ratings). |
| CV-02 | **No free trial CTA on Home page** | Home shows TrialExpiryBanner when trial is ending, but no "Start free trial" prompt for users who never started. Trial auto-starts at onboarding. | N/A — trial auto-activates. But post-trial re-engagement is weak. |
| CV-03 | **No money-back guarantee mention** | Premium.jsx has no refund policy or guarantee text. | EU has 14-day cooling-off for digital subscriptions. Not mentioning it misses a trust signal. |
| CV-04 | **No annual savings highlighted at first view** | Premium.jsx shows -37% badge but only when plan selector is visible. For trial users seeing Premium for first time, the comparison is subtle. | Anchoring effect missed. |
| CV-05 | **Referral section is null** | ReferralSection.jsx returns null. Dead component still imported in Profile.jsx. | No viral growth mechanism. |

## MISSING — Polish

| ID | Item | Evidence | Impact |
|----|------|----------|--------|
| PO-01 | **Only SVG icons in manifest** | manifest.json has only 192x192 and 512x512 SVG icons. No PNG fallback. Some browsers/OS require PNG for PWA install. | PWA install may fail on older Android/Samsung Internet. |
| PO-02 | **No splash screen configuration** | manifest.json has no `screenshots` field. No Apple splash screen meta tags in index.html. | PWA install experience is degraded on iOS (white screen during launch). |
| PO-03 | **Version hardcoded to 1.0.0** | SettingsSection.jsx:75 shows "Version 1.0.0" — hardcoded, never updated. | User can't verify which version they're running. |
| PO-04 | **No haptic feedback on most interactions** | Only Home checkin (navigator.vibrate) and PullToRefresh have haptic. Buttons, tabs, FAB have none. | Misses native app feel. Minor. |
| PO-05 | **No app rating prompt** | No "Rate us" or "Enjoying PawCoach?" prompt after positive interactions. | Missed App Store/Play Store review generation. (N/A for PWA, but useful for future). |
| PO-06 | **og:image is a JPG called paw-happy** | index.html og:image points to /mascot/paw-happy.jpg — functional but not a designed social card. | Social shares look unprofessional. |
| PO-07 | **No changelog / "what's new"** | No in-app changelog or version update notification. | Users don't know about new features. |
| PO-08 | **apple-touch-icon is JPG not PNG** | index.html line 16: `<link rel="apple-touch-icon" href="/mascot/paw-happy.jpg">`. iOS expects PNG. | iOS home screen icon may render incorrectly. |

---

## PARTIAL

| ID | Item | Status | Details |
|----|------|--------|---------|
| PA-01 | Dark mode support | PARTIAL | CSS tokens defined in index.css `.dark` class. tailwind.config uses `darkMode: "media"`. But many components use hardcoded `bg-white` which gets overridden by `.dark .bg-white` in CSS — fragile approach. Modals in SettingsSection use inline `bg-white` without dark variant. |
| PA-02 | Accessibility (ARIA) | PARTIAL | BottomNav has `aria-label="Navigation principale"`. CombinedFAB has `role="dialog"`. Chat has aria-labels on buttons. But tabs lack role="tablist", many interactive elements lack aria-label, no live regions for dynamic content. |
| PA-03 | Error handling | PARTIAL | ErrorBoundary wraps every page (good). Toast notifications on API errors (good). But no global error state for network failures. No retry mechanism except ErrorBoundary retry (2 max). |
| PA-04 | Loading states | PARTIAL | SkeletonPage used on most pages (Home, Profile, Sante, Activite, Chat, etc.). But some secondary actions (Stripe portal, badge checks, insight mark-as-read) have no visual loading feedback. |
| PA-05 | Analytics | PARTIAL | trackEvent() exists but stores in localStorage only — no real analytics service. Events tracked: onboarding_complete, premium_page_viewed, premium_checkout_clicked, scan_completed, daily_limit_reached. Good event taxonomy but no backend to analyze. |
| PA-06 | i18n / Localization | PARTIAL | UI is fully in French (strings hardcoded). manifest.json has `lang: "fr"`. But no i18n framework — expanding to other languages would require rewriting every component. |
| PA-07 | Input sanitization | PARTIAL | DogEditModal.jsx sanitizes name (strips HTML tags, special chars). pdfHelpers.js has sanitize() for PDF text. But onboarding inputs, chat messages, and form fields have no frontend sanitization before API calls. |
| PA-08 | Offline support | PARTIAL | SW caches static assets. WalkMode has offline sync for walks. But no global offline banner, no offline data access for cached entities, no background sync registration. |
| PA-09 | Reduced motion | PARTIAL | Layout.jsx, Home.jsx, Activite.jsx, Nutri.jsx check useReducedMotion(). index.css has @media (prefers-reduced-motion). But Profile.jsx, Premium.jsx, DogProfile.jsx, Onboarding.jsx do NOT check reduced motion — animations play regardless. |
| PA-10 | Destructive action confirmation | PARTIAL | Account deletion (SettingsSection) and dog deletion (DogProfile) have confirmation modals. Training program reset and library item deletion have AlertDialog. But vet access revocation (ShareVetModal) and some data modifications lack confirmation. |

---

## OK Summary

| Category | OK Count | Details |
|----------|----------|---------|
| PWA Manifest | 7/10 | name, short_name, description, start_url, display, background_color, theme_color, orientation, lang, categories all present. Missing: screenshots, PNG icons, shortcuts. |
| Service Worker | 4/6 | Install, activate, fetch strategies, cache-first for static. Missing: update prompt, offline page. |
| HTML Meta | 11/11 | charset, viewport (with viewport-fit=cover), description, og:*, twitter:*, theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style. |
| Routing | 5/5 | All 16 pages registered. Lazy loading for secondary pages. Public routes separated. 404 page exists. ErrorBoundary wraps every route. |
| Auth Flow | 5/7 | Auth guard on routes. Public routes excluded. Loading state during auth check. Error handling for auth failures. User not registered state. Missing: session timeout, biometric lock. |
| Data Loading | 8/8 | Skeleton pages. Pull-to-refresh. Cache (HomeCacheContext). Background refresh. Error toasts. Parallel fetching. Optimistic updates (checkin). Mounted guard (cleanup). |
| Navigation | 6/6 | BottomNav with 5 tabs. Secondary page parent mapping. Tab state persistence (sessionStorage). Scroll position restoration. Back button handling (useBackClose). Double-tap reset. |
| Payments | 6/8 | Stripe Checkout integration. Webhook signature verification. Idempotency check. Subscription cancellation on delete. Billing portal access. Price IDs configured. Missing: restore purchase flow, auto-renewal disclosure. |
| GDPR Deletion | 5/5 | Cascade delete all 19 entity types. Stripe subscription cancelled. User entity deleted. Confirmation modal. Irreversible warning. |
| Mobile CSS | 8/8 | overscroll-behavior: none. iOS text-size-adjust. Input font-size 16px (prevents zoom). touch-action: manipulation. Safe area padding. User-select disabled (re-enabled for content). Scrollbar styling. |
| Design System | 6/6 | CSS custom properties. HSL color tokens. Dark mode tokens. Custom utility classes (.gradient-primary, .safe-pt-*). Consistent border-radius (--radius). Font system (Inter). |
| Error Recovery | 4/5 | ErrorBoundary with retry (2x) then reload. Error toasts. Fallback UI. Home link from error page. Missing: error reporting to backend. |
| Forms | 5/8 | Disabled buttons during submission. Loading spinners. Error toasts. Save confirmation toasts. Session persistence (onboarding). Missing: inline validation errors, field-level error messages, form autosave. |

---

## Screen-Specific Gaps

### Home (H-01 to H-12)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| H-01 | Greeting / personalized header | OK | CoachHomeHeader.jsx shows user name + dog photo + time-of-day greeting |
| H-02 | Quick actions | OK | 4 quick action buttons (Scanner, Balade, Sante, Dressage) with icons |
| H-03 | Streak display | OK | Streak days shown with label tiers (Debutant/Regulier/Assidu/Champion) |
| H-04 | Daily check-in | OK | DailyBriefing with mood/energy/appetite + symptoms + AI response |
| H-05 | Loading state | OK | SkeletonPage variant="stats" |
| H-06 | Pull-to-refresh | OK | PullToRefresh component wrapping content |
| H-07 | Empty state (no dog) | OK | Redirects to Onboarding if no dogs |
| H-08 | Notifications entry | OK | NotificationCenter accessible from header |
| H-09 | Disclaimer | OK | Home.jsx:666 has veterinary disclaimer |
| H-10 | Premium nudge timing | OK | Shows after 2+ days, one-time flag |
| H-11 | Trial banner | OK | TrialExpiryBanner shows days remaining |
| H-12 | First day guide | OK | FirstDayGuide component for new users |

### Onboarding (O-01 to O-11)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| O-01 | Welcome screen | OK | OnboardingWelcome with illustration + feature pills |
| O-02 | Progress indicator | OK | progress bar computed from step/total |
| O-03 | Back navigation | OK | ChevronLeft button to go back steps |
| O-04 | Voice input | OK | SpeechRecognition API with fallback |
| O-05 | Photo upload | OK | Camera + gallery with file upload |
| O-06 | Session persistence | OK | sessionStorage saves step + answers |
| O-07 | Error recovery | OK | saveError state + toast + retry |
| O-08 | Trial activation | OK | 7-day trial auto-activated after first dog |
| O-09 | Dog limit enforcement | OK | Free: 1 dog, Premium: 3 dogs |
| O-10 | Skip optional fields | PARTIAL | OPTIONAL_STEPS allows skipping race + health. But photo step has no skip button — only "Passer" if answered. |
| O-11 | Privacy consent | MISSING | No consent checkbox before data collection |

### Settings/Profile (S-01 to S-12)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| S-01 | User info display | OK | ProfileHeader shows user name + achievement points |
| S-02 | Dog switcher | OK | DogSwitcher with add dog button |
| S-03 | Subscription management | OK | SubscriptionSection with Stripe portal link |
| S-04 | Logout | OK | Confirmation modal + base44.auth.logout() |
| S-05 | Account deletion | OK | Confirmation modal + cascade delete + "irreversible" warning |
| S-06 | Support contact | OK | support@pawcoach.app email link |
| S-07 | Version number | PARTIAL | Hardcoded "Version 1.0.0" — never updated |
| S-08 | Privacy policy link | MISSING | No link to privacy policy |
| S-09 | Terms of service link | MISSING | No link to ToS |
| S-10 | Dark mode toggle | MISSING | Uses system preference (media query) but no manual toggle |
| S-11 | Notification preferences | MISSING | WalkReminderSettings exists but no push notification toggle |
| S-12 | Language selector | N/A | French only — no i18n system |

### Premium/Pricing (PR-01 to PR-08)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| PR-01 | Feature comparison (free vs premium) | OK | FEATURES array with free/premium columns |
| PR-02 | Price display | OK | 7.99 EUR/month, 59.99 EUR/year shown clearly |
| PR-03 | Plan selector | OK | Monthly/annual toggle with -37% badge |
| PR-04 | Checkout button | OK | Stripe checkout with loading state + disabled |
| PR-05 | Success flow | OK | Confetti + toast + premium status polling |
| PR-06 | Manage subscription | OK | Stripe billing portal via SubscriptionSection |
| PR-07 | Auto-renewal notice | MISSING | No "auto-renews" text near CTA |
| PR-08 | Social proof / testimonials | MISSING | No reviews, ratings, or user count |

### Auth (A-01 to A-11)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| A-01 | Login redirect | OK | AuthProvider redirects to Base44 login |
| A-02 | Loading state | OK | PawLoader "Connexion en cours..." |
| A-03 | User not registered state | OK | UserNotRegisteredError component |
| A-04 | Auth error handling | OK | Typed errors (auth_required, user_not_registered, unknown) |
| A-05 | Token persistence | OK | localStorage via Base44 SDK |
| A-06 | Logout flow | OK | Confirmation + redirect |
| A-07 | Session refresh | MISSING | No token refresh / session validation on return |
| A-08 | Biometric lock | N/A | PWA limitation — not available |
| A-09 | Multi-device sync | OK | Server-side data — works across devices |
| A-10 | Password reset | N/A | Base44 handles auth — no custom password reset |
| A-11 | Social login | N/A | Base44 handles login methods |

### Forms (F-01 to F-10)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| F-01 | Field validation | PARTIAL | Some fields validated (CombinedFAB numeric min/max). Most use required attribute or check in handler. No inline error messages. |
| F-02 | Submit protection | OK | saving/submitting state + disabled buttons + ref guards |
| F-03 | Error feedback | PARTIAL | Toast.error on failures. No inline field errors. |
| F-04 | Success feedback | OK | Toast.success on saves |
| F-05 | Loading indicator on submit | OK | Loader2 spinner or "Chargement..." text |
| F-06 | Autofill support | OK | Standard HTML inputs support browser autofill |
| F-07 | Keyboard type hints | PARTIAL | Input font-size 16px (prevents iOS zoom). But no `inputMode="numeric"` on weight/age fields. |
| F-08 | Form state persistence | OK | Onboarding persists in sessionStorage. Other forms don't persist (acceptable). |
| F-09 | Cancel/discard confirmation | MISSING | No confirmation when leaving a partially filled form (e.g., onboarding back navigation discards without warning) |
| F-10 | Accessible error messages | MISSING | No aria-describedby linking errors to fields |

---

## Priority Matrix

| Priority | Count | Impact | Action Required |
|----------|-------|--------|-----------------|
| **Legal Risk** | 8 | GDPR fines (up to 4% revenue). EU consumer protection violations. Liability for AI health advice. | **Must fix before public launch.** |
| **WCAG Violation** | 8 | Excludes users with disabilities. Potential legal action in EU (European Accessibility Act 2025). | Fix before public launch. Critical for App Store if native wrapper later. |
| **Security** | 5 | API abuse, prompt injection, session hijacking. Moderate risk given current user base. | Fix before scaling. |
| **UX Broken** | 4 | User confusion when offline, SW updates. Low daily impact but poor edge-case experience. | Fix in next milestone. |
| **Conversion Loss** | 5 | Lower premium conversion rate. No viral growth. | Fix for growth phase. |
| **Polish** | 8 | App feels less professional. PNG icons, splash screens, social cards. | Fix for brand perception. |
| **Partial** | 10 | Working but incomplete. Dark mode fragile, analytics placeholder, reduced motion gaps. | Incremental improvement. |

---

## Top 10 Fixes — Ordered by Risk

1. **Privacy Policy + Terms of Service pages** — Create /Privacy and /Terms routes with actual legal text. Add links in SettingsSection, Onboarding, and Premium footer.
2. **GDPR consent checkbox** — Add to Onboarding before dog creation: "J'accepte la politique de confidentialite et les conditions d'utilisation."
3. **Cookie/tracking consent** — Add consent banner before analytics trackEvent() fires. Or remove analytics entirely until real service is integrated.
4. **Auto-renewal disclosure on Premium** — Add "Abonnement renouvele automatiquement. Annule a tout moment." near the subscribe button.
5. **Skip navigation link** — Add hidden "Aller au contenu" link at top of Layout.jsx.
6. **Tab ARIA roles** — Add role="tablist" / role="tab" / aria-selected to Sante, Activite, Nutri tab components.
7. **Focus management on route change** — Update document.title per page. Focus main content area after navigation.
8. **Offline banner** — Add global "Vous etes hors ligne" banner when navigator.onLine is false.
9. **SW update prompt** — Check for SW updates and show "Nouvelle version disponible — Recharger" toast.
10. **PNG icons for manifest** — Generate 192x192 and 512x512 PNG icons alongside SVG.

---

*Audit completed: 2026-03-27. 259 items evaluated across 17 categories.*
