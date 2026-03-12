---
phase: 1-refonte-esthetique-visible-page-accueil
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/home/DogRadarHero.jsx
  - src/components/home/BentoGrid.jsx
  - src/components/home/QuickActions.jsx
autonomous: true
requirements: [VISUAL-01, VISUAL-02, VISUAL-03]

must_haves:
  truths:
    - "Quand on ouvre l'app, le hero est immediatement frappant — couleurs riches, mascotte bien visible"
    - "La mascotte dans le hero est grande et opaque (pas fantome a 12%), presente en companion visible"
    - "Les tuiles BentoGrid ont des fonds colores par thematique et la mascotte y est visible"
    - "Les QuickActions ont des fonds colores solides, pas transparents"
    - "Toutes les fonctionnalites existantes (navigation, arcs, scores, moods) continuent de marcher"
  artifacts:
    - path: "src/components/home/DogRadarHero.jsx"
      provides: "Hero refondu avec mascotte grande, photo chien agrandie, fond riche"
      contains: "opacity-70|opacity-80|w-24|w-28|w-32"
    - path: "src/components/home/BentoGrid.jsx"
      provides: "Tuiles avec fonds gradient colores et mascottes visibles 50%+"
      contains: "min-h-\\[140px\\]|opacity-50|opacity-60"
    - path: "src/components/home/QuickActions.jsx"
      provides: "Pills d'action avec fonds colores solides et labels visibles"
      contains: "opacity-90|opacity-100"
  key_links:
    - from: "DogRadarHero.jsx"
      to: "PawMascot.jsx"
      via: "PawMascotInline import avec taille xl (128px)"
      pattern: "PawMascotInline.*xl"
    - from: "BentoGrid.jsx"
      to: "mascot images"
      via: "img avec opacity 50-60%"
      pattern: "opacity-\\[0\\.[56]"
---

<objective>
Refonte esthetique DRAMATIQUE et visible de la page d'accueil PawCoach. Trois composants cibles — hero, bento grid, quick actions — reconfigurees pour un impact emotionnel immediat quand l'utilisateur ouvre l'app. Pas de polish subtil : changements visibles a l'oeil nu en 1 seconde.

Purpose: Ismail a dit "je vois pas ce que t'as fait" apres les precedentes modifications (mascottes a 12% opacite, micro-animations). Le changement doit etre EVIDENT et EMOTIONNEL.
Output: 3 fichiers JSX modifies. Zero nouvelle dependance. Zero regression fonctionnelle.
</objective>

<execution_context>
@C:/Users/smalt/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/smalt/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/smalt/Desktop/app-chien-ia/pawcoach/src/components/home/DogRadarHero.jsx
@C:/Users/smalt/Desktop/app-chien-ia/pawcoach/src/components/home/BentoGrid.jsx
@C:/Users/smalt/Desktop/app-chien-ia/pawcoach/src/components/home/QuickActions.jsx
@C:/Users/smalt/Desktop/app-chien-ia/pawcoach/src/components/PawMascot.jsx

<interfaces>
<!-- PawMascotInline — image seule, pas de bulle -->
<!-- sizeMap: sm=28, md=40, lg=56 -->
<!-- IMPORTANT: Pour xl (128px), passer directement style={{ width: 128, height: 128 }} ou ajouter xl au sizeMap -->
export function PawMascotInline({ mood = "happy", size = "sm", className = "" })

<!-- Images mascotte disponibles -->
/mascot/paw-happy.jpg
/mascot/paw-curious.jpg
/mascot/paw-sleepy.jpg
/mascot/paw-excited.jpg
/mascot/paw-proud.jpg
/mascot/paw-encouraging.jpg
/mascot/paw-eating.jpg
/mascot/paw-walking.jpg
/mascot/paw-health.jpg
/mascot/paw-training.jpg

<!-- Design system Nature Premium -->
Forest green: #1A4D3E (backgrounds sombres)
Emerald: #2D9F82 (couleur primaire)
Cream: hsl(var(--background)) (fond clair)
Inter font
Spring: stiffness:400 damping:30
ZERO orange sauf data viz (d97706 dans arcs = OK car donnee)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hero Revolution — DogRadarHero.jsx</name>
  <files>src/components/home/DogRadarHero.jsx</files>
  <action>
Modifier DogRadarHero.jsx pour un impact visuel immediat. Conserver TOUTE la logique (computeArcs, Arc SVG, scores, navigation, mood badge, greeting). Modifier uniquement le visuel.

**Fond du hero — remplacer le gradient plat par un fond riche en couches:**
- Gradient principal: `from-[#0d3d2e] via-[#1a5c47] to-[#0f4c3a]` (plus de profondeur)
- Ajouter une couche de texture: `bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(45,159,130,0.4),transparent)]` en absolute inset-0
- Ajouter un decoratif shape en bas-gauche: cercle `w-48 h-48 rounded-full` positionne `absolute -bottom-16 -left-16` avec `bg-emerald-500/10 blur-3xl`
- Ajouter un decoratif shape en haut-droite: cercle `w-32 h-32 rounded-full absolute -top-8 -right-8` avec `bg-teal-400/15 blur-2xl`

**Photo du chien — agrandir de w-20/h-20 a w-28/h-28:**
- Changer `className` de l'img de `w-20 h-20` a `w-28 h-28`
- Changer le fallback div de `w-20 h-20` a `w-28 h-28`
- Renforcer le border: `border-4 border-white/60` (etait /40)
- Renforcer le shadow: `shadow-[0_0_50px_rgba(45,159,130,0.5),0_0_100px_rgba(45,159,130,0.2)]`
- Agrandir le warm glow ring derriere: `inset-[-18px]` (etait -10px)

**Arcs SVG — epaissir et booster le glow:**
- Changer `ringWidth` de 5 a 8 dans la fonction Arc
- Changer `gap` de 7 a 10 (plus d'espace entre les anneaux)
- Renforcer le filter drop-shadow: `drop-shadow(0 0 10px ${color}cc) drop-shadow(0 0 20px ${color}66)`
- La piste de fond passe de strokeOpacity 0.12 a 0.2

**Mascotte companion — la rendre VISIBLE et GRANDE:**
Remplacer le bloc mascotte existant (lignes 163-169, `w-20 h-20 opacity-[0.12]`) par un companion visible en bas-gauche du hero:

```jsx
<motion.div
  className="absolute bottom-4 left-4 pointer-events-none"
  animate={{ y: [-4, 4, -4], rotate: [-3, 3, -3] }}
  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
>
  <div className="relative">
    {/* Halo lumineux derriere la mascotte */}
    <div className="absolute inset-[-12px] rounded-full bg-emerald-400/20 blur-xl" />
    <img
      src={`/mascot/paw-${mood === 'excited' ? 'excited' : mood === 'tired' ? 'sleepy' : 'happy'}.jpg`}
      alt="Paw"
      className="w-20 h-20 rounded-full object-cover border-2 border-white/30 shadow-lg relative z-10"
      draggable={false}
      style={{ opacity: 0.85 }}
    />
  </div>
</motion.div>
```

Note: `mood` vient deja de `useDogAvatarState` en ligne 119, il est disponible dans le scope du return.

**Greeting — plus de chaleur:**
- Le texte `{greeting}, {firstName}` passe a `text-white text-xl font-bold` (etait text-lg)
- Le sous-texte de contexte (ex: "Prêt pour une belle journée...") passe a `text-white/70 text-[12px]` (etait /50 et [11px])
- Le label "PawCoach" passe a `text-emerald-300/70` (etait text-white/40)

**SIZE du radar:** Passer SIZE de 160 a 200. Le SVG et tous les calculs de rayon s'adaptent automatiquement car ils utilisent `cx = size/2`.

**Verification que la fonctionnalite est intacte:** computeArcs, Arc SVG animee, mood badge, navigation onClick, greeting, nom+race du chien — tout doit rester en place. Ne supprimer aucune prop, aucun state, aucune fonction.
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && grep -n "w-28\|w-28\|SIZE = 200\|opacity: 0.85\|bottom-4 left-4" src/components/home/DogRadarHero.jsx | head -20</automated>
  </verify>
  <done>
- Photo chien: w-28 h-28 (etait w-20 h-20)
- SIZE = 200 (etait 160)
- Mascotte companion: w-20 h-20, opacity 0.85, positionnee bottom-4 left-4 avec halo
- ringWidth = 8 dans Arc (etait 5)
- Fond: deux couches de blur decoratifs visibles
- Aucune prop ni fonction supprimee
  </done>
</task>

<task type="auto">
  <name>Task 2: BentoGrid Personality — BentoGrid.jsx</name>
  <files>src/components/home/BentoGrid.jsx</files>
  <action>
Modifier BentoGrid.jsx pour que chaque tuile ait une vraie personalite visuelle. Conserver la structure (4 tiles, Link, createPageUrl, stagger animation). Modifier uniquement le visuel des cartes.

**Hauteur minimale des tuiles — donner de la place:**
Changer `min-h-[100px]` en `min-h-[150px]` sur le div interieur de chaque tile.

**Fonds gradient par tuile — remplacer le fond quasi-transparent:**
Actuellement: `linear-gradient(135deg, hsl(var(--card)) 0%, ${tile.iconColor}08 100%)` (quasi-invisible)
Remplacer par des gradients expressifs specifiques a chaque tile.

Ajouter un champ `gradient` dans NAV_TILES:
```js
const NAV_TILES = [
  { ..., gradient: "linear-gradient(135deg, #0f3d2e 0%, #1a5c42 50%, #0d4a35 100%)" },  // Sante — foret profonde
  { ..., gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" },  // Nutrition — vert foncé
  { ..., gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)" }, // Dressage — indigo profond
  { ..., gradient: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)" }, // Chat IA — violet profond
];
```

Appliquer: `background: tile.gradient` + `borderColor: \`${tile.iconColor}40\`` sur le div container.

**Icone — agrandir et booster:**
- Container icone: `w-10 h-10 rounded-2xl` (etait w-8 h-8 rounded-xl)
- Icone elle-meme: `w-5 h-5` (etait w-4 h-4)
- Background icone: `background: \`${tile.iconColor}35\`` (etait 25)
- Border icone: `border: \`1.5px solid ${tile.iconColor}60\`` (etait 30)

**Label — texte blanc sur fond sombre:**
- `<span className="text-sm font-bold text-white">` (etait text-xs text-foreground)

**Sous-titre:**
- `<p className="text-[11px] text-white/60 font-medium mt-2">` (etait text-[10px] text-muted-foreground)

**Mascotte visible — changer opacity de 0.15 a 0.55:**
```jsx
<div className="absolute -bottom-3 -right-3 w-20 h-20 opacity-[0.55] pointer-events-none rounded-full overflow-hidden">
  <img src={tile.mascot} alt="" className="w-full h-full object-cover" draggable={false} />
</div>
```
(taille passe de w-14 h-14 a w-20 h-20, opacite de 0.15 a 0.55)

**Supprimer** le cercle decoratif `-top-6 -right-6 w-16 h-16 opacity-[0.05]` (invisible, inutile avec les nouveaux fonds).

**Ajouter un effet hover visible:**
Sur le div container de la tile, ajouter `whileHover={{ scale: 1.03 }}` au niveau du `motion.div` qui entoure le Link (ou passer whileHover directement). En Framer Motion, placer `whileHover={{ scale: 1.03 }}` sur le `motion.div key={tile.label}` (il a deja whileTap={{ scale: 0.96 }}).

**ChevronRight** — changer couleur: `text-white/30` (etait text-muted-foreground/30).

**Conserver:** structure grid 2x2, Link vers createPageUrl, stagger animation, NAV_TILES data (pages, tabs, icons, labels).
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && grep -n "min-h-\[150px\]\|opacity-\[0.55\]\|0f3d2e\|text-white\|w-20 h-20" src/components/home/BentoGrid.jsx | head -20</automated>
  </verify>
  <done>
- min-h-[150px] sur chaque tile (etait 100px)
- Fond gradient colore et sombre par tile (pas quasi-transparent)
- Mascotte: w-20 h-20 opacity-[0.55] (etait w-14 h-14 opacity-[0.15])
- Label tile: text-sm font-bold text-white (visible sur fond sombre)
- Icone: w-10 h-10 container, w-5 h-5 icone
- whileHover={{ scale: 1.03 }} sur motion.div tile
  </done>
</task>

<task type="auto">
  <name>Task 3: QuickActions Character — QuickActions.jsx</name>
  <files>src/components/home/QuickActions.jsx</files>
  <action>
Modifier QuickActions.jsx pour que les pills d'action soient visibles et invitantes, pas des boutons fantomes.

**Container de chaque action — fond colore solide:**
Remplacer le background quasi-transparent par un fond plein:
```jsx
<div
  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md relative"
  style={{
    background: `linear-gradient(135deg, ${action.color}cc, ${action.color}99)`,
    border: `1.5px solid ${action.color}`,
  }}
>
  <Icon className="w-6 h-6 text-white" />
</div>
```
(icone toujours en blanc pour lisibilite sur fond colore solide)

**Taille de l'icone:** `w-6 h-6` (etait w-5 h-5)

**Label:**
```jsx
<span className="text-[11px] font-bold text-foreground">{action.label}</span>
```
(etait text-[10px] font-semibold text-muted-foreground — plus lisible)

**Largeur de l'item:** Changer `w-[56px]` en `w-[60px]` sur le Link pour donner plus de respiration.

**Pulse ring — rendre visible:**
Le pulse ring existant est `opacity: [0, 0.3, 0]` — trop subtil. Changer en:
```jsx
animate={{ opacity: [0, 0.5, 0], scale: [1, 1.15, 1] }}
```
Et `className="absolute inset-[-4px] rounded-2xl"` avec `style={{ background: \`${action.color}30\` }}` (pas radial-gradient).

**Supprimer** le `opacity-0` initial sur la pulse ring div — garder juste l'animate.

**Conserver:** 5 actions, routes (pages + tabs), imports lucide, structure scroll horizontal, framer-motion entrance animations (initial/animate/transition sur chaque item), whileTap.
  </action>
  <verify>
    <automated>cd C:/Users/smalt/Desktop/app-chien-ia/pawcoach && grep -n "w-14 h-14\|text-white\|w-6 h-6\|linear-gradient.*color.*cc" src/components/home/QuickActions.jsx | head -20</automated>
  </verify>
  <done>
- Container action: w-14 h-14 avec fond colore solide (gradient `color}cc` a `color}99`)
- Icone: w-6 h-6 text-white (blanc sur fond colore)
- Label: text-[11px] font-bold text-foreground (visible)
- Pulse ring: opacity max 0.5 (etait 0.3)
- 5 actions conservees avec leurs routes intactes
  </done>
</task>

</tasks>

<verification>
Verification globale apres les 3 tasks:

1. **Pas de regression fonctionnelle** — tester mentalement:
   - DogRadarHero: les 4 arcs s'animent, le badge humeur apparait, clic sur la photo navigue vers DogProfile, clic sur les legendes navigue vers les bonnes pages
   - BentoGrid: les 4 tuiles naviguent vers Sante, Nutri, Activite?tab=dressage, Chat
   - QuickActions: les 5 actions naviguent vers les bonnes routes

2. **Changement visible sans avoir vu la version precedente** — si quelqu'un ouvre l'app, il doit voir:
   - Un hero sombre et riche avec une grande mascotte et une grande photo
   - Des tuiles aux fonds colores avec mascottes visibles
   - Des pills d'action avec fonds pleins et colores

3. **Design system respecte** — pas d'orange sauf dans les arcs (d97706 = acceptable car donnee), emerald/foret comme primaires, pas de nouvelles dependances
</verification>

<success_criteria>
- Mascotte dans le hero: w-20 h-20 a 85% opacite, positionnee en bas-gauche avec halo lumineux
- Photo chien: w-28 h-28 (etait w-20 h-20)
- Arcs SVG: ringWidth=8 avec glow renforce
- Tiles BentoGrid: min-h-150px, fonds sombres colores par thematique, mascottes 55% opacite
- QuickActions: fonds colores solides, icones blanches w-6 h-6
- Zero erreur de syntaxe JSX
- Zero prop ou fonction supprimee
</success_criteria>

<output>
Apres completion, creer `.planning/quick/1-refonte-esthetique-visible-page-accueil-/1-SUMMARY.md` avec:
- Ce qui a ete change exactement (avec les valeurs avant/apres cles)
- Confirmation que la fonctionnalite est intacte
- Screenshot a demander a Ismail pour valider l'impact visuel
</output>
