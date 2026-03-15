---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/home/DogRadarHero.jsx
  - src/components/home/BentoGrid.jsx
  - src/components/home/QuickActions.jsx
  - src/components/home/StreakBar.jsx
  - src/pages/Home.jsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Le header occupe ~30% du premier ecran (pas 70%)"
    - "Ligne greeting + notif badge + avatar profil sur la meme ligne statique"
    - "Photo du chien petite (48-56px), ronde, avec nom/race/score compact a droite"
    - "4 stats en row horizontale avec mini barres de progression animees"
    - "SmartAlerts apparaissent juste apres le header (position 2)"
    - "BentoGrid est en bas de page"
    - "WellnessBanner disparait du haut, remplace par disclaimer texte en bas"
    - "Aucun titre en MAJUSCULES — sentence case partout"
    - "BentoGrid fond blanc avec ombres douces (pas gradients sombres)"
    - "QuickActions pills plus soft (pas couleurs solides saturees)"
    - "StreakBar compact en mini card"
    - "Scale 0.98 sur tap des cards"
  artifacts:
    - path: "src/components/home/DogRadarHero.jsx"
      provides: "CompactHeader — greeting + dog card + stats row"
    - path: "src/pages/Home.jsx"
      provides: "Nouvelle hierarchie sections + disclaimer bas de page"
    - path: "src/components/home/BentoGrid.jsx"
      provides: "Tiles fond blanc avec ombres douces"
    - path: "src/components/home/QuickActions.jsx"
      provides: "Pills style soft"
    - path: "src/components/home/StreakBar.jsx"
      provides: "Compact dans mini card horizontale"
  key_links:
    - from: "DogRadarHero.jsx"
      to: "computeArcs()"
      via: "useMemo — scores reutilises comme mini progress bars"
    - from: "Home.jsx"
      to: "DogRadarHero"
      via: "memes props existantes — pas de changement interface"
    - from: "Home.jsx"
      to: "SmartAlerts"
      via: "deplacee en position 2 (apres header, avant TodayCard)"
---

<objective>
Refonte premium mobile-first de la page d'accueil PawCoach.

Purpose: Passer d'un hero qui occupe 70% de l'ecran a un header compact (~30%), reorganiser la hierarchie des sections pour mettre l'action au premier plan, et polir le style global vers un look premium epure (fond creme, ombres douces, pas de gradients sombres, sentence case).

Output: DogRadarHero reecrit en CompactHeader, Home.jsx reorganise avec nouvel ordre de sections, BentoGrid/QuickActions/StreakBar polis.
</objective>

<execution_context>
Workflow : modifier les fichiers dans pawcoach/ → git push → Base44 sync auto → Ismail clique "Publish".
Ne JAMAIS utiliser de Build prompts (pas de schema change). Tout se fait via Git direct.
</execution_context>

<context>
@src/pages/Home.jsx
@src/components/home/DogRadarHero.jsx
@src/components/home/BentoGrid.jsx
@src/components/home/QuickActions.jsx
@src/components/home/StreakBar.jsx
@src/components/WellnessBanner.jsx

<interfaces>
<!-- Props existantes de DogRadarHero — a conserver a l'identique (pas de changement d'interface) -->
DogRadarHero({ user, dog, streak, checkins, records, exercises, scans, dailyLogs })

<!-- computeArcs — logique a conserver, reutiliser les scores comme valeurs des mini barres -->
computeArcs({ checkins, streak, records, exercises, scans })
// retourne: [{ key, label, score, hasData, hint, color, Icon, page, tab? }, ...]
// "health"(#2d9f82), "activity"(#d97706), "training"(#6366f1), "nutrition"(#059669)

<!-- useDogAvatarState — garder pour le mood badge -->
import { useDogAvatarState } from "../dogtwin/useDogAvatarState"
const { mood } = useDogAvatarState({ checkins, streak, records, scans })
// mood: "excited" | "happy" | "neutral" | "tired"

<!-- Design tokens confirmes -->
bg-background = fond creme (Nature Premium)
text-foreground = texte principal
text-muted-foreground = texte secondaire
emerald primary: #2d9f82
shadow soft: box-shadow: 0 2px 8px rgba(0,0,0,0.06)
border-radius uniforme: rounded-2xl (16px)
spacing system: 8px (p-2=8, p-4=16, p-6=24, p-8=32)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Réécrire DogRadarHero en CompactHeader</name>
  <files>src/components/home/DogRadarHero.jsx</files>
  <action>
Réécrire DogRadarHero.jsx COMPLET en conservant le nom du fichier et du composant (import inchangé dans Home.jsx), mais avec un design totalement nouveau.

**SUPPRIMER entièrement:**
- Le fond gradient vert sombre (#0d3d2e → #1a5c47 → #0f4c3a)
- Les orbes flottants animés (6 motion.div orbs)
- La mascotte en bas-à-gauche
- Le SVG SIZE=200 avec les 4 arcs Apple Watch
- Le badge humeur flottant sous la photo
- La section nom + race + résumé (text-center mt-5)
- La légende 4x grid en bas

**GARDER (réutiliser):**
- La logique `computeArcs()` — les scores servent aux mini barres
- `useDogAvatarState` pour le mood badge discret
- `createPageUrl`, `useNavigate`, `Link`
- Les imports `motion` de framer-motion

**NOUVEAU LAYOUT (fond bg-background/blanc cassé, PAS de gradient sombre):**

Structure de base:
```jsx
<div className="px-4 pt-3 pb-3 bg-background border-b border-border/10">
  {/* Ligne 1: Greeting + icones droite */}
  {/* Ligne 2: Dog card */}
  {/* Ligne 3: Stats row */}
</div>
```

**Ligne 1 — Greeting + notif + avatar:**
```jsx
<div className="flex items-center justify-between mb-3">
  <div>
    <p className="text-xs text-muted-foreground font-medium">{greeting}</p>
    <p className="text-lg font-bold text-foreground">{firstName}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Icone cloche avec badge — statique, PAS sticky/fixed */}
    <div className="relative w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center">
      <Bell className="w-4 h-4 text-foreground/70" />
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-[9px] font-black text-white">1</span>
      </span>
    </div>
    {/* Avatar profil */}
    <Link to={createPageUrl("Profile")} className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
      <UserCircle className="w-5 h-5 text-primary" />
    </Link>
  </div>
</div>
```
Importer `Bell` et `UserCircle` depuis lucide-react.

**Ligne 2 — Dog card compacte:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-3"
>
  {/* Photo ronde petite 48px — cliquable → DogProfile */}
  <div
    role="button" tabIndex={0}
    onClick={() => navigate(createPageUrl("DogProfile"))}
    className="flex-shrink-0"
  >
    {dog?.photo ? (
      <img src={dog.photo} alt={dog?.name}
        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
    ) : (
      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
        <PawMascotInline mood="curious" size="sm" />
      </div>
    )}
  </div>
  {/* Infos chien */}
  <div className="flex-1 min-w-0">
    <p className="font-bold text-foreground text-sm leading-tight truncate">{dog?.name || "Mon chien"}</p>
    {dog?.breed && <p className="text-[11px] text-muted-foreground truncate">{dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}</p>}
    {/* Status dynamique basé sur score moyen */}
    <p className="text-[11px] font-semibold mt-0.5" style={{ color: avgScore >= 75 ? "#2d9f82" : avgScore >= 50 ? "#d97706" : "#ef4444" }}>
      {avgScore >= 75 ? "En forme" : avgScore >= 50 ? "À surveiller" : "Attention requise"}
    </p>
  </div>
  {/* Mini cercle score global (petit, pas l'enorme anneau) */}
  <div className="flex-shrink-0 w-11 h-11 relative">
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <motion.circle cx="22" cy="22" r="18" fill="none" stroke="#2d9f82" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 18}
        initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
        animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - avgScore / 100) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-foreground">{avgScore}%</span>
  </div>
</motion.div>
```
`avgScore` = Math.round des scores `arcs` qui ont des données (même logique que l'ancien résumé contextuel).

**Ligne 3 — Stats row horizontale:**
4 stats en flex row, chacune: icône colorée + label + score + mini barre de progression animée.
```jsx
<div className="flex gap-2">
  {arcs.map((arc, i) => {
    const Icon = arc.Icon;
    return (
      <motion.button
        key={arc.key}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + i * 0.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate(createPageUrl(arc.page) + (arc.tab ? `?tab=${arc.tab}` : ""))}
        className="flex-1 flex flex-col items-center gap-1 bg-white rounded-xl p-2 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
      >
        <Icon className="w-3.5 h-3.5" style={{ color: arc.color }} />
        <span className="text-[9px] font-semibold text-muted-foreground">{arc.label}</span>
        <span className="text-[11px] font-black" style={{ color: arc.hasData ? arc.color : "#94a3b8" }}>
          {arc.hasData ? `${arc.score}%` : "—"}
        </span>
        {/* Mini barre de progression */}
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: arc.color }}
            initial={{ width: 0 }}
            animate={{ width: arc.hasData ? `${arc.score}%` : "0%" }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
          />
        </div>
      </motion.button>
    );
  })}
</div>
```

**Imports à ajouter:** `Bell` depuis lucide-react (remplace `Flame` et `ScanLine` qui ne sont plus utilisés dans le rendu — garder seulement les icones utilisées dans computeArcs: Heart, Flame, Dumbbell, ScanLine).

**Supprimer imports inutilisés:** `PawMascotInline` reste si on l'utilise dans le fallback photo. `Arc` (la fonction SVG) et `moodEmoji`/`moodText` peuvent être supprimés si non utilisés. `useDogAvatarState` peut être gardé mais n'est plus utilisé dans le rendu visible — peut être supprimé pour ne pas faire d'import mort.

**IMPORTANT:** Le composant doit toujours accepter les mêmes props: `{ user, dog, streak, checkins, records, exercises, scans, dailyLogs }` — Home.jsx n'est pas modifié dans cette tâche.
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
Build passe sans erreur. DogRadarHero.jsx reecrit: fond blanc, header 3 lignes (greeting/dog-card/stats), aucun gradient sombre, aucun arc SVG 200px, photo 48px, mini barres animees, memes props.
  </done>
</task>

<task type="auto">
  <name>Task 2: Reorganiser Home.jsx + supprimer WellnessBanner</name>
  <files>src/pages/Home.jsx</files>
  <action>
Modifier Home.jsx pour le nouvel ordre des sections et supprimer WellnessBanner.

**CHANGEMENTS:**

1. **Supprimer WellnessBanner** — retirer import + les 2 occurrences de `<WellnessBanner />` (dans le return principal ET dans le loading skeleton qui a `pt-20` conditionnel). Supprimer aussi `recentCheckins.length < 3 ? "pt-20" : ""` du className du wrapper (plus besoin du padding-top conditionnel).

2. **Supprimer le bloc "Emotional moment"** (motion.div avec PawMascotInline et le texte contextuel) — trop verbeux, supprimé selon le brief. La fonction `getEmotionalMoment` peut rester mais ne plus être appelée dans le render (ou la supprimer aussi pour nettoyer).

3. **Nouvel ordre des blocs dans `<PullToRefresh>`:**

```jsx
{/* 1. CompactHeader */}
<DogRadarHero user={user} dog={dog} streak={streak} checkins={recentCheckins}
  records={records} exercises={exercises} scans={scans} dailyLogs={dailyLogs} />

{/* 2. Alertes urgentes — juste apres le header */}
<div className="mt-2 px-4">
  <SmartAlerts dog={dog} checkins={recentCheckins} records={records}
    streak={streak} dailyLogs={dailyLogs} scans={scans} />
</div>

{/* 3. Action du jour */}
<div className="mt-3">
  <TodayCard dog={dog} user={user} todayCheckin={todayCheckin} streak={streak}
    recommendations={recommendations} onCheckin={handleCheckin} submitting={submitting} />
</div>

{/* 4. Programmes en cours */}
<div className="mt-3">
  <ActiveProgramCards trainingBookmarks={trainingBookmarks}
    nutritionPlans={nutritionPlans} behaviorBookmarks={behaviorBookmarks} />
</div>

{/* 5. Raccourcis rapides */}
<div className="mt-3">
  <QuickActions />
</div>

{/* 6. Streak + Habitude */}
<div className="mt-3">
  <StreakBar streak={streak} walkStreak={walkStreak} exercises={exercises} dailyLogs={dailyLogs} />
</div>

{/* 7. Le savais-tu / coaching quotidien */}
<div className="mt-3">
  <DailyCoaching dog={dog} recommendations={recommendations} />
</div>

{/* 8. Navigation secondaire BentoGrid — plus bas */}
<div className="mt-3">
  <BentoGrid />
</div>

{/* 9. Trial expiry */}
<div className="mt-3">
  <TrialExpiryBanner user={user} dog={dog} />
</div>

{/* 10. Weekly Insight */}
{(weeklyInsight || pastInsights.length > 0) && (
  <div className="mt-3">
    <WeeklyInsightCard insight={weeklyInsight} previousInsight={previousInsight}
      pastInsights={pastInsights} dog={dog} expanded={insightExpanded}
      onToggle={() => setInsightExpanded(e => !e)} onMarkRead={handleMarkInsightRead}
      markingRead={markingRead} />
  </div>
)}

{/* 11. Disclaimer veterinaire — bas de page */}
<p className="text-center text-[10px] text-muted-foreground px-6 mt-6 mb-2">
  PawCoach est un outil de suivi bien-etre. En cas de probleme de sante, consulte un veterinaire.
</p>
```

4. **Mettre a jour le loading skeleton** — changer le hero skeleton de `h-56 bg-gradient-to-br from-[#0f4c3a]...` en skeleton compact:
```jsx
{/* Hero skeleton compact */}
<div className="px-4 pt-3 pb-3 border-b border-border/10 space-y-3">
  <div className="h-8 w-40 bg-muted/50 rounded-xl animate-pulse" />
  <div className="h-16 bg-muted/40 rounded-2xl animate-pulse" />
  <div className="flex gap-2">
    {[0,1,2,3].map(i => (
      <div key={i} className="flex-1 h-14 bg-muted/40 rounded-xl animate-pulse" />
    ))}
  </div>
</div>
```
Supprimer les motion.div avec shimmer dans le skeleton — remplacer par `animate-pulse` simple Tailwind.

5. **Supprimer import WellnessBanner** en haut du fichier.

6. **Garder absolument:** Toute la logique data (useEffect, handleCheckin, handleRefresh, handleMarkInsightRead, walkStreak useMemo, recommendations useMemo), CombinedFAB, BottomNav, PremiumNudgeSheet, PostTrialSheet, MilestoneCelebration, AnimatePresence milestone. Ces blocs ne touchent pas a l'ordre visuel.
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
Build passe. Home.jsx: WellnessBanner supprime, emotional moment supprime, SmartAlerts en position 2, BentoGrid en position 8, disclaimer texte en bas. Aucune donnee perdue.
  </done>
</task>

<task type="auto">
  <name>Task 3: Polish BentoGrid + QuickActions + StreakBar</name>
  <files>
    src/components/home/BentoGrid.jsx
    src/components/home/QuickActions.jsx
    src/components/home/StreakBar.jsx
  </files>
  <action>
Ajustements de style sur 3 composants pour aligner avec le design premium.

---

**BentoGrid.jsx — Passer du dark au light:**

Remplacer les `gradient` sombres dans NAV_TILES par un fond blanc avec bordures et ombres douces:

```jsx
const NAV_TILES = [
  { icon: Heart, iconColor: "#2d9f82", label: "Sante", sub: "Carnet, vaccins, poids", page: "Sante" },
  { icon: Utensils, iconColor: "#059669", label: "Nutrition", sub: "Scans, plans repas", page: "Nutri" },
  { icon: Dumbbell, iconColor: "#6366f1", label: "Dressage", sub: "Exercices, programmes", page: "Activite", tab: "dressage" },
  { icon: MessageCircle, iconColor: "#8b5cf6", label: "Chat IA", sub: "Questions sante", page: "Chat" },
];
```
(Supprimer les champs `gradient` et `mascot` du tableau.)

Modifier la card dans le return:
```jsx
<div
  className="relative overflow-hidden rounded-2xl p-4 min-h-[110px] flex flex-col justify-between bg-white border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform"
>
  {/* Tache de couleur douce en arriere-plan */}
  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.08]"
    style={{ background: tile.iconColor }} />
  <div className="relative flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: tile.iconColor + "15", border: `1.5px solid ${tile.iconColor}30` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: tile.iconColor, width: 18, height: 18 }} />
      </div>
      <span className="text-sm font-semibold text-foreground">{tile.label}</span>
    </div>
    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
  </div>
  <p className="text-[11px] text-muted-foreground font-medium mt-2">{tile.sub}</p>
</div>
```
Supprimer l'`<img>` mascot. Ajouter `whileTap={{ scale: 0.98 }}` (remplace le 0.96 existant).
Ajouter un titre de section avant la grille:
```jsx
<p className="text-xs font-semibold text-muted-foreground px-4 mb-2">Explorer</p>
```

---

**QuickActions.jsx — Pills plus soft:**

Remplacer le fond solid saturé par un fond clair avec icone colorée:
```jsx
<div
  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] bg-white border border-border/20 relative"
>
  <Icon className="w-6 h-6" style={{ color: action.color }} />
</div>
```
Supprimer le `linear-gradient` en `background` et la `border` colorée. Garder le `whileTap={{ scale: 0.92 }}`. Supprimer l'animation de pulse ring (motion.div avec opacity/scale loop) — trop chargé.
Le label sous le bouton: `text-[11px] font-semibold text-foreground/70` (au lieu de `font-bold text-foreground`).

---

**StreakBar.jsx — Compact, pas de changement structurel:**

Le composant est deja bien — juste harmoniser le style:
- Dans la card principale du streak: changer `background: linear-gradient(135deg, hsl(var(--card)) 0%, ${level.color}06 100%)` → `background: white` et `boxShadow: "0 2px 8px rgba(0,0,0,0.06)"`.
- Supprimer `border-color: ${level.color}20` → remplacer par `className="border-border/20"`.
- Le walk streak chip et le badge chip: changer les fonds bleu/ambre opaque par des fonds plus doux — `bg-blue-50/80` et `bg-amber-50/80` (deja ok, juste s'assurer que les bordures sont legeres).
- Ajouter `whileTap={{ scale: 0.98 }}` sur les motion.div cliquables si applicable.

Aucun changement de logique ou de donnees dans ces 3 fichiers.
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
Build passe. BentoGrid: tiles blanches avec ombres douces, pas de gradients sombres, titre "Explorer". QuickActions: fond blanc, icones colorees, pas d'animation pulse, style soft. StreakBar: card blanche avec ombre, bordures neutres.
  </done>
</task>

</tasks>

<verification>
Apres les 3 taches, verifier visuellement sur mobile (390px) via Base44 preview:
- Header visible en ~30% du premier ecran (greeting + dog card + 4 stats)
- Fond blanc/creme en haut (AUCUN gradient vert sombre)
- SmartAlerts en 2e position
- BentoGrid bien en bas
- "PawCoach est un outil de suivi..." visible en bas de page
- Aucun titre en MAJUSCULES visible (verifier "Programme 7 jours" dans ActiveProgramCards → deja en mixed case, laisser si conforme)
- Tap sur cards: scale 0.98 visible
</verification>

<success_criteria>
- `npm run build` passe sur les 3 commits
- DogRadarHero: plus de gradient #0d3d2e, photo 48px, stats en row horizontale avec mini barres
- Home.jsx: WellnessBanner absent, SmartAlerts position 2, BentoGrid position 8, disclaimer texte en bas
- BentoGrid: tiles blanches avec box-shadow doux, plus de dark gradients
- QuickActions: fond blanc, pas d'animation pulse ring, style soft
- StreakBar: fond blanc avec ombre, bordures neutres
</success_criteria>

<output>
Apres completion, noter dans STATE.md:
- Quick task 2 complete: refonte premium mobile-first page accueil
- Commit hash a noter

Pas de SUMMARY.md requis pour les quick tasks.
</output>
