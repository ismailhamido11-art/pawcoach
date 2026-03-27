# Art Direction Audit -- PawCoach

**Date:** 2026-03-27
**Auditor:** Senior Art Director (code-based visual audit)
**Overall Score: 8.1/10**

---

## Dimension Scores

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Color System | 8.5/10 | Mature token system, well-structured dark mode, minor charte violations (orange) |
| Typography | 8/10 | Clean Inter stack with tight heading tracking, but some inline font-size inconsistency |
| Spacing & Layout | 7.5/10 | Strong grid usage, but px-5 vs px-4 padding inconsistency across pages |
| Visual Hierarchy | 8.5/10 | Gradient hero headers create strong hierarchy, layered cards are well-differentiated |
| Motion & Interaction | 9/10 | Best-in-class for a PWA. Framer Motion everywhere, spring presets centralized, a11y respected |
| Iconography | 8/10 | Consistent Lucide set, custom SVG mascots (PawIllustrations), one style |

---

## Dimension Details

### 1. Color System -- 8.5/10

**What's good:**
- Fully tokenized in `src/index.css` with HSL variables: `--background: 37 33% 95%` (cream), `--primary: 160 50% 22%` (forest), `--accent: 162 55% 42%` (emerald).
- Semantic tokens: `--safe` (green), `--caution` (amber), `--toxic` (red) for food safety.
- Complete dark mode inversion at the token level (lines 53-73 of index.css) -- not bolted on, designed from the start.
- Gradient utilities (`gradient-primary`, `gradient-warm`, `gradient-card`) with proper dark mode overrides (line 195-197).
- Dark mode remaps 12+ Tailwind `-50` background colors to dark-friendly HSL equivalents (lines 278-298) -- this is thorough work.
- Confetti uses on-brand colors: `["#1A4D3E", "#2D9F82", "#10b981", "#34d399"]` (Premium.jsx:100).

**What's bad:**
- **9 files use orange classes** (`text-orange`, `bg-orange`, `border-orange`) despite the charte "ZERO orange" rule. Files: `badgeUtils.jsx`, `DogTrophiesRow.jsx`, `AchievementsSection.jsx`, `CoachSettings.jsx`, `InlineCheckin.jsx`, `StreakBar.jsx`, `EmotionalTip.jsx`, `DiagnosisContent.jsx`, `TrackerHistory.jsx`.
- **2 files use yellow** (`text-yellow`, `bg-yellow`): `AITrainingProgram.jsx`, `NearbyParks.jsx` -- also a charte violation.
- Sante.jsx line 214 uses `from-teal-50/50` in an illustrated card background -- teal is a restricted color.
- Sante.jsx line 256 uses `from-red-50 to-orange-50/50` for the diagnosis tab -- orange in a gradient stop.
- Some hardcoded hex colors in components (`#8b5cf6`, `#ec4899`, `#3b82f6`) instead of using design tokens -- Dashboard.jsx stat cards (lines 281-284) and Premium.jsx features list (lines 34-41). Not wrong per se, but creates drift risk.

### 2. Typography -- 8/10

**What's good:**
- Global font stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (index.css:80) -- professional, legible.
- Anti-aliasing enabled: `-webkit-font-smoothing: antialiased` (line 81).
- Premium heading style: tight `letter-spacing: -0.025em` + `font-weight: 700` on h1-h3 (lines 87-90).
- Body tracking: `-0.011em` (line 83) -- subtle but elevates feel.
- Badge refinement: `font-weight: 600; letter-spacing: 0.01em` on small badges (lines 248-252).

**What's bad:**
- Mixed font sizes across components: `text-[11px]`, `text-[10px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[15px]` used inline instead of sticking to a Tailwind scale (text-xs=12px, text-sm=14px). Found in DailyBriefing.jsx, Sante.jsx, Profile.jsx. Creates a "between sizes" feeling.
- Hero subtitles inconsistent: Sante.jsx uses `text-[11px] font-bold tracking-widest uppercase` for "PawCoach" label, Dashboard.jsx does not have one.
- No explicit `line-height` tokens beyond Tailwind defaults -- `leading-relaxed` and `leading-tight` used but not systematically.

### 3. Spacing & Layout -- 7.5/10

**What's good:**
- Pages use 4/8px grid consistently in card padding (`p-4`, `p-5`, `p-6`).
- Safe area padding handled via custom utility classes (`safe-pt-8` through `safe-pt-24` in index.css:177-182) -- smart approach.
- Bottom nav respects `env(safe-area-inset-bottom)` (index.css:228).
- Cards consistently use `rounded-2xl` or `rounded-3xl` with `shadow-sm border border-border/40`.
- Grid layouts: `grid grid-cols-2 gap-3` for stat cards, `grid grid-cols-5 gap-1.5` for tabs -- no arbitrary gaps.

**What's bad:**
- **Page horizontal padding inconsistent**: Dashboard uses `px-5` (line 275), Sante uses `px-4` and `px-5` mixed (line 213 for header, line 255 for content), Profile uses `px-5` (line 131). The 1px difference (20px vs 16px) creates subtle misalignment when navigating.
- Tab content in Sante.jsx uses `px-4 pt-4 pb-2` (line 213) while the main page uses `px-5`. Content is not edge-aligned.
- Space between sections: Home uses `space-y-6` (line 481), Dashboard uses `space-y-5` (line 275), Profile uses `space-y-4` (line 131). No single rhythm.
- Bottom padding before BottomNav: some pages rely on the BottomNav height, others add explicit `pb-28` (SkeletonPage.jsx:115). No consistent footer spacing system.

### 4. Visual Hierarchy -- 8.5/10

**What's good:**
- Strong 3-tier hierarchy: gradient hero header (primary) > white cards (secondary) > muted backgrounds (tertiary).
- Every major page has a gradient header with `gradient-primary` + decorative blur circles (consistent pattern in Dashboard, Sante, Premium, Welcome).
- Cards have well-differentiated roles: stat cards (small, icon+value), info cards (illustrated, larger padding), action cards (clickable with chevron).
- CTAs stand out: `h-14 rounded-2xl gradient-warm/gradient-primary text-white font-bold shadow-lg` (Premium.jsx:494-507). Visually distinct from everything else.
- Status badges with dot indicators (DailyBriefing.jsx:137-141) create visual urgency without being noisy.

**What's bad:**
- Dashboard and Sante share the same visual pattern (gradient header + illustrated cards) but Dashboard lacks the sub-label ("PawCoach" uppercase marker) that Sante has -- mild inconsistency.
- "Prochaines etapes recommandees" section in Dashboard (line 414) looks identical to other card lists with no visual differentiation from the chart cards above.
- Profile page has many sections stacked with identical card styling (white bg, rounded-2xl, border) -- some sections could benefit from grouping or visual separation.

### 5. Motion & Interaction -- 9/10

**What's good:**
- Centralized animation presets in `src/lib/animations.js`: `spring` (stiffness:360, damping:28), `springGentle`, `springSnappy`, `tapScale`, `pressIn`, `fadeInUp`, `staggerContainer/staggerItem` -- professional motion system.
- Spring physics feel native: `stiffness: 400, damping: 30` on tab transitions (Sante.jsx:200, BottomNav.jsx:103).
- Horizontal tab slides with `AnimatePresence mode="wait"` and direction-aware animation (Sante.jsx:225-233) -- feels like iOS navigation.
- `prefers-reduced-motion` respected: CSS blanket override (index.css:308-318), component-level checks (`useReducedMotion()` in Home.jsx, `window.matchMedia` in EmptyState.jsx, SkeletonPage.jsx, useCountUp.js) -- 15 occurrences across 9 files.
- Haptic feedback via `navigator.vibrate` in 10 files -- creates native-like tactile response.
- `whileTap: { scale: 0.97 }` on cards and buttons throughout -- consistent press feedback.
- BottomNav active indicator with `layoutId="bottomNavIndicator"` (line 101) -- smooth spring transition between tabs.
- Subtle breathing animations on hero illustrations: `animate={{ scale: [1, 1.03, 1] }}` with 5s repeat (Dashboard.jsx:222-223).

**What's bad:**
- Some pages define inline spring values (`stiffness: 500, damping: 35` in Sante.jsx:233) instead of importing from `animations.js`. The centralized presets exist but aren't always used.
- Stagger delays are hardcoded per-page: Dashboard uses `delay: i * 0.07` (line 290), Profile uses `delay: i * 0.05` (line 119), Premium uses `delay: i * 0.07` (line 237). Minor inconsistency.
- No gesture-based navigation between tabs (swipe left/right) -- only tap-to-switch.

### 6. Iconography -- 8/10

**What's good:**
- Lucide React icons used exclusively across all pages -- consistent style.
- Icon sizes follow a clear scale: `w-3 h-3` (inline), `w-4 h-4` (labels), `w-5 h-5` (nav/actions), `w-7 h-7` (hero).
- Custom SVG illustrations via `PawIllustrations.jsx` (20 mascots: DogWave, DogDetective, DogChef, etc.) -- unified brand personality.
- Storyset illustrations via `StorysetIllustration` component -- used for empty states, info cards, and premium sections (61 usages across 28 files).
- IconBadge component for consistent icon-in-circle styling (Premium.jsx:241).

**What's bad:**
- Some icon colors are hardcoded as inline styles (`style={{ color: step.color }}` in Dashboard.jsx:427) instead of using Tailwind classes -- harder to theme.
- Quick action buttons in Home.jsx (lines 380-441) use hand-drawn inline SVGs that feel slightly different from the Lucide/PawIllustrations style -- a minor aesthetic tension.
- BottomNav icons use `stroke-[2.5]` for active and `stroke-[1.75]` for inactive (line 94) -- good differentiation but the active stroke is heavier than typical mobile nav patterns.

---

## Premium Feel Checklist

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Consistent border radius | OK | `--radius: 0.875rem` token + `rounded-2xl` (758 occurrences) and `rounded-3xl` as main card radii across 120 files |
| 2 | Subtle shadows | OK | Card system: `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` (index.css:162-164). No harsh shadows found. |
| 3 | Micro-interactions on tap | OK | `whileTap: { scale: 0.97 }` on cards, `whileTap: { scale: 0.93 }` on tabs, `active:scale-[0.97]` CSS fallback |
| 4 | Smooth page transitions | OK | `AnimatePresence mode="wait"` + spring-based tab slides + `fadeInUp` on page mount |
| 5 | Custom illustrations | OK | 20 PawIllustrations mascots + Storyset SVGs (61 usages). No stock photos. |
| 6 | Refined color palette | OK | 3 main colors (cream, forest, emerald) + 2 semantic (safe, caution) + accent violet/blue for secondary features. Minor orange leak. |
| 7 | Whitespace breathing room | OK | `p-5`/`p-6` on cards, `space-y-5`/`space-y-6` between sections, `pb-6` on DailyBriefing |
| 8 | Professional loading states | OK | Custom `SkeletonPage` with 4 variants (stats, list, detail, chat), brand-colored bones (`bg-primary/10`), hero skeleton with illustration |
| 9 | Polished empty states | OK | Dedicated `EmptyState` component with 20 mascots, Storyset illustrations, Lottie animation support, action button, reduced-motion support |
| 10 | Haptic feedback | OK | `navigator.vibrate()` in 10 files (check-in, walk tracking, scan, health record entry) |
| 11 | Bottom sheet patterns | OK | `PremiumNudgeSheet`, `PostTrialSheet`, `HealthAssistantSheet` -- sheets used instead of alerts for complex interactions |
| 12 | Swipe gestures | MISSING | No swipe-to-navigate between tabs or swipe-to-dismiss patterns found. Direction-aware animation exists but only triggered by tap. |
| 13 | Pull-to-refresh | OK | `PullToRefresh` component used on Home, Sante, and data-heavy pages |
| 14 | Skeleton screens | OK | Rich skeleton system with hero, stats, list, detail, and chat variants. Brand-colored loading bones. |
| 15 | Blur/glassmorphism accents | OK | Bottom nav: `backdrop-filter: blur(16px) saturate(180%)` (index.css:230). DailyBriefing: `backdrop-blur-sm` on glassmorphic elements. Sheet overlay: `backdrop-filter: blur(4px)`. |
| 16 | Gradient subtlety | OK | `gradient-primary: linear-gradient(135deg, ...)` with only 10deg hue shift. `gradient-card: linear-gradient(145deg, white, sage)` -- subtle, not decorative. |
| 17 | Typography variety | OK | 4 weights observable: `font-extrabold`/`font-black` (heroes), `font-bold` (headings), `font-semibold` (labels), `font-medium` (body). Plus `italic` for coach messages. |
| 18 | Card elevation consistency | OK | Global card shadow system in index.css (lines 160-173). Same shadow for all cards, hover state adds depth uniformly. |
| 19 | Status bar integration | PARTIAL | Safe area padding classes exist (`safe-pt-*`), but no `<meta name="theme-color">` variation per page detected in the audited files. |
| 20 | Safe area respect | OK | `env(safe-area-inset-top)` in safe-pt-* utilities, `env(safe-area-inset-bottom)` in bottom-nav. Both iOS notch and home indicator covered. |

**Checklist score: 18/20 items OK** (swipe gestures missing, status bar theme-color partial)

---

## AI Slop Detector

| # | Sign | Found? | Where |
|---|------|--------|-------|
| 1 | Generic gradient backgrounds | No | Gradients are brand-colored (forest-to-emerald), not generic blue/purple. Consistent across all pages. |
| 2 | Oversized icons | No | Icons follow strict scale: 3/3.5/4/5/7. No icon > w-7 in navigation/action context. |
| 3 | Too many colors (rainbow) | MILD | Quick actions in Home.jsx use amber, emerald, violet, blue gradients for 4 buttons -- justified (semantic category colors) but approaches rainbow territory. |
| 4 | Inconsistent border radius | No | `rounded-2xl` dominant (758 occurrences). `rounded-3xl` for illustrated info cards. `rounded-xl` for icon badges. Clear hierarchy. |
| 5 | Stock illustration mixed with custom | No | Only custom PawIllustrations + Storyset (consistent vectorial style). No stock photos/illustrations detected. |
| 6 | Default shadcn without customization | No | shadcn/ui customized via CSS variables, custom card shadow system, brand-colored focus rings (`rgba(22,78,62,0.1)`), custom scrollbar. |
| 7 | No visual brand identity | No | Strong brand: cream background, forest/emerald palette, custom dog mascots, "PawCoach" label pattern, gradient-primary headers. Instantly recognizable. |
| 8 | Generic card layouts everywhere | No | Cards vary by purpose: stat cards (icon+number), illustrated cards (image+text), action cards (chevron), chart cards (graph), info cards (badge-style). 5+ distinct card types. |
| 9 | No visual hierarchy between sections | No | 3-tier system works: gradient hero > card content > muted auxiliary. Each section has distinct visual weight. |
| 10 | Uniform spacing | No | `space-y-4`, `space-y-5`, `space-y-6` used contextually. Gap varies between tight (stats: gap-3) and loose (sections: gap-6). |
| 11 | No motion/animation | No | Framer Motion everywhere. Spring physics, staggered entrances, breathing animations, tab slides, haptic feedback. Best dimension of the app. |
| 12 | Boring/default form styles | No | Custom input focus rings, `font-size: 16px !important` anti-zoom, custom MobileSelect component, VoiceInput component. |
| 13 | No personality in empty states | No | 20 dog mascots with personality (DogDetective, DogChef, DogSleepy, etc.), floating animation, contextual messages. Strong empty state system. |
| 14 | Cookie-cutter layout across all pages | No | Pages have distinct structures: Home (briefing-first), Dashboard (stats grid), Sante (5-tab pill nav), Profile (stacked sections), Premium (hero+comparison table). |
| 15 | No color story | No | Clear narrative: forest green = authority/primary, emerald = action/accent, amber = warning only, violet = training feature, blue = health feature. |

**AI Slop score: 0/15 signs detected** (1 mild flag on quick action colors -- within acceptable limits)

---

## Top 5 Visual Issues (priority order)

### 1. Charte Violations: Orange/Yellow in 11 Files (HIGH)
**Impact:** Breaks the "ZERO orange" design rule established in the charter.
**Files:** `badgeUtils.jsx`, `DogTrophiesRow.jsx`, `AchievementsSection.jsx`, `CoachSettings.jsx`, `InlineCheckin.jsx`, `StreakBar.jsx`, `EmotionalTip.jsx`, `DiagnosisContent.jsx`, `TrackerHistory.jsx`, `AITrainingProgram.jsx`, `NearbyParks.jsx`.
**Fix:** Replace orange classes with amber (for warnings) or emerald (for positive states). Replace yellow with amber or remove.

### 2. Inconsistent Page Padding: px-4 vs px-5 (MEDIUM)
**Impact:** Content appears to shift 4px horizontally when navigating between pages. Noticeable on mobile.
**Pages affected:** Sante (px-4 content, px-5 header), Dashboard (px-5 throughout), Profile (px-5 throughout), Home (px-5 throughout).
**Fix:** Standardize to px-5 (20px) for all page-level content padding, or px-4 (16px) for all. Pick one.

### 3. Custom Font Sizes Outside Tailwind Scale (MEDIUM)
**Impact:** Creates visual noise between text-xs (12px) and text-sm (14px). Nine distinct custom pixel sizes used: 10px, 11px, 12px, 13px, 14px, 15px.
**Where:** DailyBriefing.jsx (text-[15px], text-[12px], text-[10px]), Sante.jsx (text-[11px], text-[14px]), Profile.jsx (text-[14px], text-[11px]).
**Fix:** Map custom sizes to a 3-level sub-scale: caption (10-11px), detail (12-13px), body (14-15px). Define as Tailwind extensions or use consistently.

### 4. Animation Presets Not Always Used (LOW)
**Impact:** Spring values defined in `animations.js` (stiffness:360, damping:28) are sometimes overridden inline with different values (stiffness:500, damping:35 in Sante.jsx; stiffness:400, damping:30 in BottomNav.jsx). Not a visual defect, but adds maintenance debt.
**Fix:** Import from `animations.js` or define additional named presets (`springFast`, `springTab`) if different values are intentional.

### 5. Missing Swipe Gesture Support (LOW)
**Impact:** Tab-based pages (Sante, Activite, Nutri) support direction-aware slide animation but only on tap. Horizontal swipe to switch tabs is a standard mobile pattern that would complete the native feel.
**Fix:** Add `onPanEnd` gesture handler via Framer Motion to detect horizontal swipe and trigger tab change. Direction tracking infrastructure already exists (`tabDir`, `prevTabIdx`).

---

## Summary

PawCoach scores **8.1/10** overall -- a strong result that puts it comfortably in "premium PWA" territory. The motion system (9/10) and visual hierarchy (8.5/10) are standout qualities. The color system is well-architected but has enforcement issues (orange/yellow leaks). Spacing inconsistency is the most impactful visual issue for the user -- fixing px-4 vs px-5 alignment would be a quick win with high perceived improvement.

The app passes the AI Slop Detector clean (0/15 signs) and achieves 18/20 on the Premium Feel Checklist. The remaining gaps (swipe gestures, status bar theme-color) are polish items, not structural problems.

**Verdict: This app does not look AI-generated. It has a clear brand identity, intentional design decisions, and a level of animation polish that most commercial apps lack.**
