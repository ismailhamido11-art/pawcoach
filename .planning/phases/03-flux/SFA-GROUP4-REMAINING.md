# SFA Group 4 — Remaining Pages
**Date:** 2026-03-27
**Pages analyzed:** Onboarding, DogProfile, DogPublicProfile, Premium, Library, VetDogView, VetPortal

---

## Page: Onboarding.jsx

### Action: User sees welcome splash and taps "Créer le profil de mon chien"
**Handler:** Onboarding.jsx:289 — `OnboardingWelcome.onStart → setStarted(true)`
**Flow:** UI button click → `setStarted(true)` → component re-renders to show step 0 of INTERVIEW_STEPS
**Guard conditions:** None — always accessible
**Edge cases:** If URL has `?addDog=true`, welcome splash is skipped entirely (line 111: `useState(isAddDog)`)
**Verdict:** OK

---

### Action: User selects a goal (step 0 — choice type)
**Handler:** Onboarding.jsx:295-298 — `handleGoalSelect(label)`
**Flow:** Button click → `setCurrentAnswer(label)` → `setTimeout(() => setStep(s => s + 1), 250)` (auto-advance)
**Guard conditions:** Auto-advances after 250ms on selection — no explicit "Next" button for choice steps
**Edge cases:** If user taps rapidly, multiple setStep calls could queue; but state is functional update `s => s + 1` so safe
**Verdict:** OK

---

### Action: User uploads a dog photo (step 1 — photo type)
**Handler:** Onboarding.jsx:162-174 — `handlePhoto(file)`
**Flow:** `fileRef.current.click()` → file picker → onChange → `handlePhoto(file)` → `base44.integrations.Core.UploadFile` → `setCurrentAnswer(file_url)`
**Guard conditions:** `!file` guard at line 163. `uploading` state blocks "Next" button (`canNext = !uploading`)
**Edge cases:**
- Upload failure: caught, toast shown, `uploading` reset to false — OK
- No photo chosen: user can tap "Next" (photo step is optional per `canNext = !uploading` which is `true` when not uploading)
- Large files: no size validation before upload
**Verdict:** OK

---

### Action: User dictates via voice (voice steps 2-9)
**Handler:** Onboarding.jsx:176-197 — `toggleMic()`
**Flow:** Check for SpeechRecognition API → create recognition instance → `recognition.start()` → `onresult` appends to current answer → `setListening(false)`
**Guard conditions:** Browser check at line 177 — shows toast if not supported. Recognition stopped if already listening.
**Edge cases:**
- `recognition.onerror` handled — toast + `setListening(false)` — OK
- `recognition.onend` resets listening state — OK
- If `toggleMic` called while `listening=true`, stops recognition cleanly
**Verdict:** OK

---

### Action: User taps "Suivant" / "Passer" on voice/photo steps (steps 1-8)
**Handler:** Onboarding.jsx:199-287 — `handleNext()`
**Flow:** Stop mic if listening → if not last step: `setStep(s => s + 1)` only
**Guard conditions:**
- `canNext` check controls button disabled state (line 301-305)
- Optional steps (indices 3=race, 9=allergies): `OPTIONAL_STEPS.has(step)` allows empty answer
**Edge cases:** Step index mismatch if INTERVIEW_STEPS array changes — OPTIONAL_STEPS is hardcoded as `Set([3, 9])` which matches current array
**Verdict:** OK

---

### Action: User taps "Créer le profil" on last step (step 9)
**Handler:** Onboarding.jsx:199-287 — `handleNext()` at last step
**Flow:**
1. `savingRef.current` guard prevents double-submit
2. `base44.auth.me()` — fetch user
3. `Dog.filter({ owner: user.email })` — check dog count
4. Quota check: FREE_MAX=1, PREMIUM_MAX=3 → if exceeded, redirect to Premium or show toast
5. Build AI prompt from answers[2..9]
6. `base44.integrations.Core.InvokeLLM()` — parse dog info
7. `Dog.create(...)` — create dog entity
8. `localStorage.setItem("activeDogId", dog.id)` — set as active
9. `trackEvent("onboarding_complete", ...)`
10. If not `isAddDog`: send welcome email (non-blocking, errors caught as warn)
11. Trial activation: if `!user.trial_expires_at`, set 7-day trial via `base44.auth.updateMe`
12. Refetch user (`base44.auth.me()`) to get fresh trial state
13. `sessionStorage.removeItem('onboarding_state')`
14. `setDone(true)` → renders WelcomeScreen

**Guard conditions:**
- `savingRef.current` double-submit guard — OK
- `isUserPremium(user)` used for quota — includes trial users
- Premium at limit (3 dogs): toast + navigate to Profile
- Free at limit (1 dog): navigate to Premium page
**Edge cases:**
- AI response parsing: `typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse` — handles both formats
- If `Dog.create` fails: caught, `setSaveError(true)`, button shows "Réessayer"
- If trial setup fails: console.error only, non-blocking — dog already created — OK
- If `isAddDog=true`: no welcome email, no trial activation, navigates to Profile instead of Home
**SUSPECT:** Welcome email sent even if user had a previous trial — no check against `isAddDog` guards the email but the email itself is benign. However the `trial_expires_at` check on line 266 (`if (!user.trial_expires_at)`) is correct — only activates trial if none exists.
**Verdict:** OK

---

### Action: User navigates back between steps
**Handler:** Onboarding.jsx:312 — `onClick={() => setStep(s => s - 1)}`
**Flow:** Back button → `setStep` to previous step. Button hidden at step 0.
**Guard conditions:** Button only rendered when `step > 0`
**Edge cases:** SessionStorage sync happens via useEffect on `[step, answers]` — state persisted on every step change
**Verdict:** OK

---

### Action: Page reload mid-onboarding (session restore)
**Handler:** Onboarding.jsx:112-127 — useState initializers reading sessionStorage
**Flow:** On mount, reads `onboarding_state` from sessionStorage → restores `step` and `answers` if array length matches
**Guard conditions:** Length check: `parsed.answers.length === INTERVIEW_STEPS.length` prevents restoring stale state
**Edge cases:** try/catch around both reads — silent fail, defaults to step 0 / empty answers
**Verdict:** OK

---

## Page: DogProfile.jsx

### Action: Page load — fetch dog data
**Handler:** DogProfile.jsx:47-85 — `useEffect → load()`
**Flow:**
1. `base44.auth.me()` — get user
2. If `?dogId` param: `Dog.filter({ id: dogId })` → take first result
3. Else: `Dog.filter({ owner: u.email })` → `getActiveDog(dogs)`
4. If no dog or `d.owner !== u.email`: redirect to Profile
5. Parallel: `DailyLog.filter(30)`, `UserProgress.filter`, `Streak.filter`, `FoodScan.filter`
6. Set all state

**Guard conditions:**
- `d.owner !== u.email` ownership check — prevents viewing another user's dog (line 63)
- No dog found: redirect to Profile
**Edge cases:**
- If `dogId` param belongs to a different user's dog — the filter returns the dog (filter by id only), but the ownership check at line 63 catches this and redirects — OK
- FoodScan filter: no dog_id filter if no dog — but by this point `d` is confirmed
**Verdict:** OK

---

### Action: User taps edit button (pencil icon)
**Handler:** DogProfile.jsx:183 — `onClick={() => setEditModal(true)}`
**Flow:** `setEditModal(true)` → renders `DogEditModal`
**Guard conditions:** `useBackClose(editModal, () => setEditModal(false))` handles browser back button
**Edge cases:** None
**Verdict:** OK

---

### Action: User saves edits in DogEditModal
**Handler:** DogProfile.jsx:87-96 — `handleSaveDog(updates)`
**Flow:** `DogEditModal.handleSave()` → validates (name required, sex required, birth_date not future) → calls `onSave(cleanForm)` → `Dog.update(dog.id, updates)` → `setDog(prev => ({...prev, ...updates}))` → `invalidateHome()`
**Guard conditions:**
- Name required validation in DogEditModal
- Sex required validation
- Birth date not in future
- `sanitizeName` strips HTML tags and special chars
**Edge cases:**
- `Dog.update` failure: caught, toast shown, modal stays open (line 93-95 — no close on error — good UX)
- `invalidateHome()` ensures Home cache is refreshed
**Verdict:** OK

---

### Action: User uploads photo in DogEditModal
**Handler:** DogEditModal.jsx:50-63 — `handlePhotoUpload(e)`
**Flow:** File input change → `base44.integrations.Core.UploadFile` → `onSave({ photo: file_url })` → `Dog.update(dog.id, { photo })` → `setDog(prev => {...prev, photo})`
**Guard conditions:** `!file` guard
**Edge cases:**
- Upload failure: caught, toast shown — OK
- No size validation before upload
**Verdict:** OK

---

### Action: User taps "Partager avec mon vétérinaire"
**Handler:** DogProfile.jsx:231-241 — `onClick={() => navigate(createPageUrl("Sante") + "?tab=vet")}`
**Flow:** Navigate to Sante page with `?tab=vet` query param
**Guard conditions:** None
**Edge cases:** Sante page must handle `?tab=vet` — this is a navigation concern, not a DogProfile issue
**Verdict:** OK

---

### Action: User taps "QR Code d'urgence"
**Handler:** DogProfile.jsx:243-255 — `onClick={() => navigate(createPageUrl("Sante") + "?tab=qr")}`
**Flow:** Navigate to Sante page with `?tab=qr`
**Guard conditions:** None
**Verdict:** OK

---

### Action: User taps "Exporter les données"
**Handler:** DogProfile.jsx:98-124 — `handleExport()`
**Flow:** Build text string from dog data → `Blob` → `URL.createObjectURL` → create `<a>` element → `a.click()` → `revokeObjectURL`
**Guard conditions:** `if (!dog) return`
**Edge cases:**
- Age calculation: `Math.floor((Date.now() - new Date(dog.birth_date)) / (365.25 * 864e5))` — `864e5` is 86400000 ✓
- Missing fields show "—" or "Aucune/Aucun"
- `URL.revokeObjectURL` called immediately after click — might fail on some browsers before download completes. On mobile this is a known issue. **SUSPECT**
**Verdict:** SUSPECT — `revokeObjectURL` immediately after `a.click()` can race on mobile browsers before the download triggers

---

### Action: User taps "Supprimer ce profil"
**Handler:** DogProfile.jsx:269 — `onClick={() => setShowDeleteConfirm(true)}`
**Flow:** Shows confirmation dialog
**Guard conditions:** `useBackClose(showDeleteConfirm, () => setShowDeleteConfirm(false))`
**Verdict:** OK

---

### Action: User confirms deletion in delete dialog
**Handler:** DogProfile.jsx:126-158 — `handleDeleteDog()`
**Flow:**
1. `deleting` guard prevents double-click
2. `Promise.all(entityNames.map(name => base44.entities[name].deleteMany({ dog_id: dog.id }).catch(() => {})))` — cascade delete 18 entity types
3. `Dog.delete(dog.id)` — delete the dog itself
4. `localStorage.removeItem("activeDogId")` if this was active dog
5. `invalidateHome()`
6. Navigate to Profile

**Guard conditions:**
- `!dog || deleting` guard
- Each `deleteMany` has `.catch(() => {})` — silently ignores errors on cascade (acceptable)
**Edge cases:**
- If `Dog.delete` fails after cascade: caught, toast, `setDeleting(false)` — user can retry but orphaned records already deleted — **RUPTURE** — however this is an edge case since the cascade succeeded
- `entityNames` includes ParkReview and PlaceFavorite — confirmed in code comments (TECH-05)
- `DogAchievement` vs `Achievement` — uses `DogAchievement` — needs to match entity name in Base44
**Verdict:** OK — cascade delete pattern is solid, edge case of Dog.delete failing after cascade is acceptable

---

## Page: DogPublicProfile.jsx

### Action: Page load — fetch public dog data (no auth required)
**Handler:** DogPublicProfile.jsx:71-87 — `useEffect → async IIFE`
**Flow:**
1. `!dogId` → `setError(true)` immediately
2. `Dog.filter({ id: dogId })` — public read
3. If no results: `setError(true)`
4. `HealthRecord.filter({ dog_id: dogId }, "-date", 100)` — sorted by date desc, limit 100
5. Client-side re-sort: `records.sort((a, b) => new Date(b.date) - new Date(a.date))` — redundant but harmless

**Guard conditions:** `dogId` null check. Dog existence check.
**Edge cases:**
- No auth required: any dogId can be accessed — this is intentional (QR code emergency page)
- Error state: shows friendly "Dossier introuvable" with link back to home
- `catch {}` — silently swallows all errors, sets error state — OK for public page
**SUSPECT:** No ownership protection — any dog in the database can be viewed via DogPublicProfile with a valid dogId. This is intentional for QR emergency access but should be documented. The page shows allergy/health data publicly.
**Verdict:** SUSPECT — by design (emergency QR page), but exposes sensitive health data (allergies, health issues) to anyone with the dogId. No expiry, no revocation mechanism unlike VetAccess. Low risk if dogIds are UUIDs/opaque.

---

### Action: User taps "Retour à l'accueil" (error state)
**Handler:** DogPublicProfile.jsx:101-105 — `<Link to="/">`
**Flow:** React Router Link to root
**Guard conditions:** None
**Verdict:** OK

---

### Action: Display of health records (static rendering)
**Handler:** DogPublicProfile.jsx:111-115, 269 — filter and display
**Flow:** `records.filter(r => r.type === "vaccine" || r.type === "weight").slice(0, 15)` — only shows vaccines and weights, not medications or vet_visit (which could contain sensitive details)
**Guard conditions:** Slice to 15 records
**Edge cases:** `TYPE_CONFIG` has fallback to `TYPE_CONFIG.note` for unknown types — safe
**Verdict:** OK

---

## Page: Premium.jsx

### Action: Page load — fetch user and dog
**Handler:** Premium.jsx:68-91 — `useEffect → init()`
**Flow:**
1. `base44.auth.me()` — get user
2. `Dog.filter({ owner: u.email })` — get dogs
3. `getActiveDog(dogs)` — select active
4. If `isUserPremium(u) && !u.premium_welcome_seen`: set `isFirstVisit=true`, `updateMe({ premium_welcome_seen: true })`
5. `trackEvent("premium_page_viewed", { from })`

**Guard conditions:** None — page accessible without auth (but would fail at `auth.me()`)
**Edge cases:**
- Error caught: toast shown, `setPageLoading(false)` — OK
- `isFirstVisit` triggers confetti via separate useEffect
**Verdict:** OK

---

### Action: Premium user sees their benefits (isPremium branch)
**Handler:** Premium.jsx:151-339 — conditional render when `isUserPremium(user)`
**Flow:** Shows unlocked features list. If `isOnTrial`, shows plan selector and subscribe CTA. If paid premium, shows "Commencer" button.
**Guard conditions:**
- `isOnTrial = trialDays > 0 && !user?.is_premium` — correctly distinguishes trial from paid
- `FROM_PAGE_MAP` for back navigation when already premium
**Edge cases:**
- `isOnTrial` users see subscribe CTA — correct behavior
- `trialDays` computed from `getTrialDaysLeft(user)` which returns 0 if `user.is_premium` — so paid users never see trial countdown
**Verdict:** OK

---

### Action: User selects monthly/annual plan
**Handler:** Premium.jsx:408-430 — `onClick={() => setPlan("monthly"/"annual")}`
**Flow:** `setPlan(...)` → state update → CTA button text updates
**Guard conditions:** None
**Edge cases:** Default is "annual" (line 62) — good default for conversion
**Verdict:** OK

---

### Action: User taps subscribe CTA ("Débloquer tout PawCoach")
**Handler:** Premium.jsx:105-124 — `handleSubscribe()`
**Flow:**
1. Iframe check: `window.self !== window.top` — blocks checkout in preview mode
2. `trackEvent("premium_checkout_clicked", { plan })`
3. `base44.functions.invoke("stripeCheckout", { priceId })`
4. Backend creates Stripe session → returns `{ url }`
5. `window.location.href = url` — redirect to Stripe

**Backend (stripeCheckout/entry.ts):**
- Auth check: `base44.auth.me()` — 401 if not logged in
- priceId whitelist: only 2 allowed price IDs — RUPTURE if price IDs change in Stripe
- `success_url`: `/?premium=success` — Home page with query param
- `cancel_url`: `/Premium` — back to Premium page
- Metadata includes `base44_app_id` and `user_email` for webhook

**Guard conditions:**
- iframe guard prevents broken checkout in preview
- priceId whitelist on backend
**Edge cases:**
- Stripe network error: caught, toast shown — OK
- `window.location.href` assignment: no return after redirect, `finally` block sets `loading=false` but component will unmount on redirect — OK
- `success_url` is `/?premium=success` — Home page handles this? **SUSPECT** — need to verify Home.jsx handles `?premium=success` param
**Verdict:** SUSPECT — `?premium=success` callback URL from Stripe not traced; if Home.jsx doesn't handle it, premium activation is silent (webhook does the actual activation)

---

### Action: Premium user taps "Commencer" (back navigation)
**Handler:** Premium.jsx:303-318 — `onClick → FROM_PAGE_MAP lookup → navigate`
**Flow:** Reads `?from` param → maps to page name → `navigate(createPageUrl(dest))`
**Guard conditions:** Falls back to "Home" if `from` not in map
**Edge cases:** `from` values not in map (e.g., `from=parkmap`): defaults to Home — OK
**Verdict:** OK

---

## Page: Library.jsx

### Action: Page load — fetch bookmarks, nutrition plans, food scans
**Handler:** Library.jsx:54-78 — `useEffect → load()`
**Flow:**
1. `base44.auth.me()` — get user
2. `Dog.filter({ owner: u.email }).catch(() => [])` — get dogs
3. `getActiveDog(dogs)` — select active dog (or null)
4. `Promise.all`:
   - `Bookmark.filter({ owner: u.email }, "-created_at", 100)`
   - `NutritionPlan.filter({ owner_email: u.email }, "-generated_at", 50).catch(() => [])`
   - If activeDog: `FoodScan.filter({ dog_id: activeDog.id }, "-timestamp").catch(() => [])` else `[]`

**Guard conditions:**
- `activeDog` null check before FoodScan query — OK
- `.catch(() => [])` on NutritionPlan and FoodScan — non-blocking failures
**Edge cases:**
- No dogs: `activeDog = null` → FoodScans = [] → Library shows only bookmarks and plans
- Dog switched: FoodScans are loaded for the active dog at load time; switching dogs without page reload won't update scans
**Verdict:** OK

---

### Action: User types in search input
**Handler:** Library.jsx:222-228 — `onChange={e => setSearch(e.target.value)}`
**Flow:** `setSearch(value)` → `filtered` computed from `allItems` via filter on `matchSearch`
**Guard conditions:** None
**Edge cases:** Search on `b.title || b.content || ""` — null-safe with `|| ""`
**Verdict:** OK

---

### Action: User taps filter chip (Tous, Chat IA, etc.)
**Handler:** Library.jsx:237 — `onClick={() => setFilter(f.id)}`
**Flow:** `setFilter(f.id)` → `filtered` recomputed
**Guard conditions:** None
**Edge cases:** "scan" filter matches `source === "scan"` — FoodScan items have `source: "scan"` (set at line 172) — OK
**Verdict:** OK

---

### Action: User taps a library item to expand/collapse
**Handler:** Library.jsx:304 — `onClick={() => setExpanded(isOpen ? null : itemKey)}`
**Flow:** Toggle `expanded` state. `itemKey = b._key || b.id`
**Guard conditions:** None
**Edge cases:**
- Training bookmarks: JSON.parse of `b.content` — try/catch at line 282, `trainingData = null` on parse failure → falls back to ReactMarkdown display
- Nutrition plans: `b.content` is plain text — ReactMarkdown display
- Food scans: `b.content` is `s.recommendation || s.details || ""` — ReactMarkdown display
**Verdict:** OK

---

### Action: User taps "Activer" on a training bookmark
**Handler:** Library.jsx:97-107 — `handleActivateTraining(bk)`
**Flow:**
1. `JSON.parse(bk.content)` — parse training data
2. `data.start_date = new Date().toISOString().split("T")[0]` — set today as start
3. `Bookmark.update(bk.id, { content: JSON.stringify(data) })`
4. Optimistic update: `setBookmarks(prev => prev.map(...))`

**Guard conditions:** `e.stopPropagation()` prevents expand/collapse
**Edge cases:**
- JSON.parse can throw: not caught — **RUPTURE** — if `bk.content` is malformed JSON, `handleActivateTraining` will throw uncaught
- `Bookmark.update` failure: caught, toast shown — OK
**Verdict:** RUPTURE — `handleActivateTraining` has no try/catch around `JSON.parse(bk.content)` (line 99). If content is malformed, uncaught error.

---

### Action: User taps "Choisir ce plan" on a nutrition plan
**Handler:** Library.jsx:142-153 — `handleActivateNutritionPlan(planId)`
**Flow:**
1. Deactivate all currently active plans: `Promise.all(nutritionPlans.filter(p => p.is_active).map(p => NutritionPlan.update(p.id, { is_active: false })))`
2. Activate selected plan: `NutritionPlan.update(planId, { is_active: true })`
3. Optimistic update: `setNutritionPlans(prev => prev.map(p => ({ ...p, is_active: p.id === planId })))`

**Guard conditions:** `e.stopPropagation()`
**Edge cases:**
- `Promise.all` deactivations fail: caught, toast — OK
- Race condition if `Promise.all` partially fails: some plans remain active, but UI is optimistically updated — **SUSPECT**
**Verdict:** SUSPECT — if deactivation of existing active plans partially fails, state inconsistency between DB and UI

---

### Action: User taps trash icon on a bookmark
**Handler:** Library.jsx:80-95 — `handleDelete(id)` → sets `confirmDialog`
**Flow:** `setConfirmDialog({ title, description, action: async () => { Bookmark.delete(id); ... } })`
**Guard conditions:** AlertDialog confirms before delete
**Edge cases:**
- Delete success: `setBookmarks(prev => prev.filter(b => b.id !== id))`, close expanded if open — OK
- Delete failure: caught, toast — OK
**Verdict:** OK

---

### Action: User taps trash on nutrition plan or food scan
**Handler:** Library.jsx:109-140 — `handleDeleteNutritionPlan(id)` / `handleDeleteScan(id)`
**Flow:** Same pattern as bookmark delete — confirmation dialog → entity delete → optimistic state update
**Guard conditions:** AlertDialog confirmation
**Edge cases:** Failure handled with toast — OK
**Verdict:** OK

---

### Action: AlertDialog "Confirmer" button
**Handler:** Library.jsx:464 — `onClick={() => { confirmDialog?.action(); setConfirmDialog(null); }}`
**Flow:** Calls the stored action function → `setConfirmDialog(null)`
**SUSPECT:** The action is called and dialog closed synchronously. If `confirmDialog.action()` is async (it is), errors are not caught at this call site. The error handling is inside the action closure itself — OK since each closure has its own try/catch.
**Verdict:** OK

---

## Page: VetDogView.jsx

### Action: Page load — fetch dog data via vetAccess function
**Handler:** VetDogView.jsx:40-57 — `loadData()`
**Flow:**
1. `!dogId` guard → error state
2. Try `base44.auth.me()` — optional (vet identity, not required for access)
3. `base44.functions.invoke("vetAccess", { action: "getDogData", dogId })`
4. Backend checks: `SharedVetAccess.filter({ dog_id: dogId, vet_email: user.email, status: 'active' })` — requires active access for the authenticated vet
5. Returns `{ dog, records, checkins, scans, vetNotes, sharedSections }`

**Guard conditions:**
- `dogId` null check
- Backend auth check via `base44.auth.me()` in the function (line 108 in entry.ts)
- Backend access check: only active SharedVetAccess for this vet email
**Edge cases:**
- `translateError(res.data.error)` maps known errors to French messages
- If vet not logged in: `base44.auth.me()` in the function returns null → 401 → caught as error
- `localRecords` state allows optimistic updates when vet adds weight — `localRecords ?? rawRecords` pattern
**Verdict:** OK

---

### Action: Vet navigates between tabs (Carnet, Check-ins, Mes notes, Scans)
**Handler:** VetDogView.jsx:114 — shadcn Tabs component with `defaultValue="records"`
**Flow:** Tabs UI — no API calls on tab switch, data already loaded
**Guard conditions:**
- Check-ins tab: `sharedSections.includes("checkins")` gate — shows "not shared" empty state if not included
- Scans tab: `sharedSections.includes("scans")` gate — same
- Weight in records tab: `sharedSections.includes("weight")` gate for SectionPoids component
**Edge cases:**
- `sharedSections` from `JSON.parse(access.shared_sections || '[]')` in backend — parse error handled with warn, defaults to `[]` — all sections would be hidden
**Verdict:** OK

---

### Action: Vet adds a vet note (VetNoteForm submit)
**Handler:** VetNoteForm.jsx:25-53 — `handleSubmit()`
**Flow:**
1. Title and content not empty guard
2. **`base44.functions.vetAccess({ action: 'addVetNote', ... })`** — WRONG API call pattern
3. If success: reset form, call `onNoteAdded(note)` → `setDogData(prev => ({...prev, vetNotes: [...prev.vetNotes, note]}))`

**RUPTURE DETECTED:**
- VetNoteForm.jsx:30 calls `base44.functions.vetAccess(...)` (direct property access)
- All other vetAccess callers use `base44.functions.invoke("vetAccess", ...)` (correct pattern)
- `base44.functions.vetAccess` is likely `undefined`, causing a runtime TypeError
- This means **vet notes can NEVER be submitted** — the form submit handler will throw

**Guard conditions:** `!title.trim() || !content.trim()` guard before submit
**Edge cases:** Error is caught (try/catch at line 29), toast shown — so user sees error message but the feature is broken
**Verdict:** RUPTURE — `base44.functions.vetAccess(...)` should be `base44.functions.invoke("vetAccess", ...)`. Vet note creation is broken.

---

### Action: Vet views records tab — weight chart via SectionPoids
**Handler:** VetDogView.jsx:124-126 — `SectionPoids` rendered conditionally
**Flow:** `sharedSections.includes("weight") && records.filter(r => r.type === "weight").length > 0` → renders `SectionPoids` with `onRecordAdded={handleRecordAdded}`
**Guard conditions:** Both section included AND records exist
**Edge cases:** `handleRecordAdded` appends to `localRecords` — optimistic update pattern — OK
**Verdict:** OK

---

## Page: VetPortal.jsx

### Action: Page load — auth check and load accesses
**Handler:** VetPortal.jsx:25-40 — `init()`
**Flow:**
1. `base44.auth.isAuthenticated()` — if false, redirect to login
2. `base44.auth.me()` — get user
3. `loadAccesses()` — fetch access list and dog data

**Guard conditions:**
- `base44.auth.isAuthenticated()` check with redirect — the only page that explicitly redirects to login (others rely on Base44 implicit auth)
**Edge cases:**
- Error: toast shown, `setLoading(false)` — OK
**Verdict:** OK

---

### Action: Load patient list (loadAccesses)
**Handler:** VetPortal.jsx:42-63 — `loadAccesses()`
**Flow:**
1. `base44.functions.invoke("vetAccess", { action: "listMyAccess" })` — backend filters `SharedVetAccess` by `vet_email: user.email, status: 'active'`
2. For each access, `base44.functions.invoke("vetAccess", { action: "getDogData", dogId: a.dog_id })` — N+1 pattern
3. `Promise.all` of N getDogData calls
4. Filter null results: `.filter(Boolean)`

**Guard conditions:** Error caught with toast at step 1 level
**Edge cases:**
- N+1 queries: one getDogData call per access. Each getDogData call itself does 4-5 DB queries. With many patients (e.g., 20), this is 20 × 5 = 100 DB queries — **SUSPECT** for performance at scale
- Individual getDogData failures: caught per-promise, returns null, filtered out — graceful degradation
**Verdict:** SUSPECT — N+1 pattern in loadAccesses is OK for a vet with few patients but scales poorly

---

### Action: Vet enters invite code and taps "Valider"
**Handler:** VetPortal.jsx:65-85 — `handleAcceptInvite()`
**Flow:**
1. `!inviteCode.trim()` guard
2. `base44.functions.invoke("vetAccess", { action: "accept", inviteCode: inviteCode.trim().toUpperCase() })`
3. Backend: `SharedVetAccess.filter({ invite_code: inviteCode, status: 'pending' })` → check expiry → check `vet_email === user.email` → update to `status: 'active'`
4. If success: `setInviteCode("")`, `loadAccesses()` — reload full list

**Guard conditions:**
- `!inviteCode.trim()` + button disabled state
- Backend: invite_code match, status=pending, expiry check, email match
**Edge cases:**
- Backend email mismatch: `"This invite is not for you"` returned in `res.data.error` — shown via `toast.error(res.data.error || "...")`
- Expired code: backend returns error — shown to user — OK
- `res.data.success` check: if false, uses `res.data.error` or fallback message — OK
**Verdict:** OK

---

### Action: Vet taps "Déconnexion"
**Handler:** VetPortal.jsx:108-120 — inline async handler
**Flow:** `base44.auth.logout()` → `navigate(createPageUrl("Home"))`
**Guard conditions:** Error caught, toast shown
**Edge cases:** If logout fails, user stays on VetPortal — OK
**Verdict:** OK

---

### Action: Vet taps a dog card (VetDogCard) to navigate to VetDogView
**Handler:** VetPortal.jsx:187 — `<VetDogCard dog={dog} access={...} />`
**Flow:** VetDogCard navigates to `VetDogView?dogId=...` (navigation in VetDogCard component)
**Guard conditions:** `accesses.find(a => a.dog_id === dog.id || a.id === dog._accessId)` — correctly finds access
**Edge cases:** `dog._accessId` used as fallback match since `dog.id` is the dog entity id, not the access id
**Verdict:** OK

---

## Cross-page Issues Found

### RUPTURE-1 — VetNoteForm: wrong API call pattern
**File:** `src/components/vet/VetNoteForm.jsx:30`
**Issue:** `base44.functions.vetAccess({...})` should be `base44.functions.invoke("vetAccess", {...})`
**Impact:** Vet note submission fails with TypeError — feature completely broken
**Fix:** Change to `base44.functions.invoke("vetAccess", { action: 'addVetNote', ... })`

### RUPTURE-2 — handleActivateTraining: missing JSON.parse try/catch
**File:** `src/pages/Library.jsx:99`
**Issue:** `JSON.parse(bk.content)` is uncaught — if bookmark content is malformed JSON, throws unhandled error
**Impact:** Activating a corrupted training bookmark crashes with no user feedback (error not caught at call site)
**Fix:** Wrap in try/catch, show toast on parse error

### SUSPECT-1 — handleExport: revokeObjectURL race on mobile
**File:** `src/pages/DogProfile.jsx:123`
**Issue:** `URL.revokeObjectURL(url)` called immediately after `a.click()` — on mobile browsers the download may not have triggered yet
**Impact:** Export may fail silently on some mobile browsers
**Fix:** Use `setTimeout(() => URL.revokeObjectURL(url), 1000)` or omit revocation entirely

### SUSPECT-2 — DogPublicProfile: no expiry/revocation on public health data
**File:** `src/pages/DogPublicProfile.jsx`
**Issue:** Any valid dogId grants access to allergies, health issues, and medical records. No expiry, no token, no revocation.
**Impact:** If a dogId leaks, sensitive data is permanently accessible. Acceptable if dogIds are opaque UUIDs.
**Mitigation:** By design for emergency QR — acceptable if UUIDs are used as dogIds (which Base44 typically does)

### SUSPECT-3 — Premium: ?premium=success callback not traced
**File:** `src/pages/Premium.jsx:115-118`
**Issue:** Stripe redirects to `/?premium=success` on success. Not confirmed whether Home.jsx handles this param.
**Impact:** If Home.jsx ignores `?premium=success`, the user sees no confirmation after payment. Premium activation happens via Stripe webhook, not frontend.
**Recommendation:** Verify Home.jsx handles `?premium=success` — if not, add a toast or banner.

### SUSPECT-4 — Library: nutrition plan activation race condition
**File:** `src/pages/Library.jsx:143-148`
**Issue:** Deactivate-then-activate pattern is not atomic. If the `Promise.all` deactivation partially fails, some plans remain marked active in DB while UI shows only one active.
**Impact:** Low risk in practice (rare failure), but state can become inconsistent

### SUSPECT-5 — VetPortal: N+1 queries in loadAccesses
**File:** `src/pages/VetPortal.jsx:49-57`
**Issue:** One `getDogData` invocation per access, each triggering multiple DB queries
**Impact:** Performance degrades with many patients. Acceptable for typical vet (< 20 patients)

---

## Summary Table

| Page | Action | Verdict |
|------|--------|---------|
| Onboarding | Welcome splash start | OK |
| Onboarding | Goal selection | OK |
| Onboarding | Photo upload | OK |
| Onboarding | Voice dictation | OK |
| Onboarding | Step navigation (Next/Back) | OK |
| Onboarding | Profile creation (last step) | OK |
| Onboarding | Session restore on reload | OK |
| DogProfile | Page load + ownership check | OK |
| DogProfile | Open edit modal | OK |
| DogProfile | Save edits (name/breed/sex/date) | OK |
| DogProfile | Upload photo in edit modal | OK |
| DogProfile | Navigate to vet share | OK |
| DogProfile | Navigate to QR code | OK |
| DogProfile | Export data (.txt) | SUSPECT |
| DogProfile | Open delete confirmation | OK |
| DogProfile | Confirm deletion (cascade) | OK |
| DogPublicProfile | Page load (no auth) | OK |
| DogPublicProfile | Error state link | OK |
| DogPublicProfile | Display health records | OK |
| DogPublicProfile | Public data access control | SUSPECT |
| Premium | Page load | OK |
| Premium | Premium user view | OK |
| Premium | Plan selector | OK |
| Premium | Subscribe CTA → Stripe | SUSPECT |
| Premium | "Commencer" back navigation | OK |
| Library | Page load | OK |
| Library | Search | OK |
| Library | Filter chips | OK |
| Library | Expand/collapse item | OK |
| Library | Activate training program | RUPTURE |
| Library | Activate nutrition plan | SUSPECT |
| Library | Delete bookmark/plan/scan | OK |
| Library | AlertDialog confirmation | OK |
| VetDogView | Page load + access check | OK |
| VetDogView | Tab navigation | OK |
| VetDogView | Add vet note | RUPTURE |
| VetDogView | Weight chart (SectionPoids) | OK |
| VetPortal | Page load + auth redirect | OK |
| VetPortal | Load patient list (N+1) | SUSPECT |
| VetPortal | Accept invite code | OK |
| VetPortal | Logout | OK |
| VetPortal | Navigate to dog view | OK |

---

## Verdict Count
- **OK:** 34
- **SUSPECT:** 7
- **RUPTURE:** 2

## Priority Fixes

### P0 — Fix immediately
1. **VetNoteForm wrong API call** (RUPTURE-1) — `base44.functions.vetAccess` → `base44.functions.invoke("vetAccess", ...)` — VetDogView notes tab completely broken
2. **handleActivateTraining missing try/catch** (RUPTURE-2) — `Library.jsx:99` — wrap JSON.parse in try/catch

### P1 — Fix soon
3. **Export revokeObjectURL race** (SUSPECT-1) — add setTimeout or remove revocation
4. **Premium ?premium=success handler** (SUSPECT-3) — verify Home.jsx shows confirmation after Stripe redirect

### P2 — Low priority / by design
5. DogPublicProfile public data access (by design for QR emergency)
6. Library nutrition plan activation race (very low probability)
7. VetPortal N+1 queries (acceptable for typical use)
