# PawCoach — Design System

> Extrait du code source le 28 mars 2026. Reference unique pour toute modification visuelle.
> Source of truth : `src/index.css` (variables) + `tailwind.config.js` (extensions) + `src/lib/animations.js` (presets).

---

## Identite visuelle

**Nom de code :** Nature Premium
**Mood :** Chaleureux, organique, premium. Evoque la nature et le soin animal.
**Pas :** clinique, froid, corporate, generique SaaS.

---

## Couleurs

### Tokens CSS (HSL — definis dans `:root` de `index.css`)

| Token | HSL | Hex approx. | Usage |
|-------|-----|-------------|-------|
| `--background` | 37 33% 95% | #F5F1EB | Fond global cream |
| `--foreground` | 160 30% 10% | #121F1B | Texte principal |
| `--card` | 0 0% 100% | #FFFFFF | Fond des cartes |
| `--primary` | 160 50% 22% | #1A4D3E | Forest green — boutons, headers, CTA |
| `--primary-foreground` | 0 0% 100% | #FFFFFF | Texte sur primary |
| `--secondary` | 150 20% 95% | #EFF5F2 | Fond subtil sage |
| `--muted` | 150 10% 94% | #EEEFED | Fonds desactives |
| `--muted-foreground` | 160 10% 45% | #687068 | Texte secondaire |
| `--accent` | 162 55% 42% | #2D9F82 | Emerald vif — accents, indicateurs |
| `--accent-foreground` | 0 0% 100% | #FFFFFF | Texte sur accent |
| `--destructive` | 0 72% 51% | #DE2B2B | Erreurs, suppressions |
| `--border` | 0 0% 90% | #E5E5E5 | Bordures |
| `--ring` | 160 50% 22% | #1A4D3E | Focus rings (= primary) |

### Tokens semantiques nutrition

| Token | HSL | Hex approx. | Usage |
|-------|-----|-------------|-------|
| `--safe` | 145 60% 42% | #2BAB6C | Aliment safe |
| `--caution` | 38 92% 55% | #EFA11B | Aliment caution (amber) |
| `--toxic` | 0 72% 51% | #DE2B2B | Aliment toxique |

### Gradients

| Classe CSS | Definition | Usage |
|-----------|-----------|-------|
| `.gradient-primary` | `linear-gradient(135deg, hsl(160,50%,22%), hsl(162,45%,32%))` | Headers de page, CTA principaux, chat bubble user |
| `.gradient-warm` | `linear-gradient(135deg, hsl(160,50%,22%), hsl(162,50%,38%))` | Variante plus lumineuse |
| `.gradient-card` | `linear-gradient(145deg, white, hsl(150,15%,97%))` | Cards premium subtiles |

### Couleurs Tailwind utilisees (hors tokens)

Utilisees avec moderation dans des contextes specifiques :

| Couleur | Contexte autorise | Exemple |
|---------|------------------|---------|
| `amber-50/100/200/400/500/600/700` | Warnings, streaks, nutrition caution | Badges, fond cartes streak |
| `emerald-50/400/600/900` | Health, safe, nature | Badges safe, photo overlay |
| `blue-50/100/400/600/700` | Dashboard, info, navigation | Carte dashboard |
| `violet-50/100/400/600/700` | Carnet sante, premium features | Badges sante |
| `rose-400/600` | Alertes sante, urgence | Quick action icon |
| `red-50/600` | Destructif, erreurs | Boutons supprimer, banners erreur |
| `slate-800` | Offline banner | Banner hors-ligne |

### INTERDIT

- **ZERO orange** — utiliser `amber` pour les warnings
- **ZERO teal** comme primaire — `emerald` et `primary` couvrent ce spectre
- **ZERO jaune vif** — `amber` seulement, et en contexte warning/caution
- **ZERO indigo/violet comme primaire** — reserve aux accents sante uniquement

---

## Typographie

### Font stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Defini dans `index.css:80` ET `tailwind.config.js:53`.
Inter est charge en web font. Les fallbacks sont les system fonts natives.

### Echelle typographique (observee dans le code)

| Taille | Tailwind | Usage |
|--------|----------|-------|
| 11px | `text-[11px]` | Micro-copy, disclaimers, timestamps |
| 12px | `text-xs` / `text-[12px]` | Badges, labels, sous-texte |
| 14px | `text-sm` / `text-[14px]` | Corps de carte, titres secondaires |
| 15px | `text-[15px]` | Titres de section mid-size (streaks) |
| 16px | `text-base` / `text-[16px]` | Titres de recommendations, boutons CTA |
| 20-24px | `text-xl` / `text-2xl` | Titres de page dans les headers |
| 30px+ | `text-3xl` | Chiffres hero (health score, etc.) |

### Poids et espacement

| Element | Font-weight | Letter-spacing | Reference |
|---------|------------|----------------|-----------|
| Body | 400 (regular) | -0.011em | `index.css:83` |
| Headings h1-h3 | 700 (bold) | -0.025em | `index.css:88-90` |
| Badges | 600 (semibold) | 0.01em | `index.css:249-252` |
| CTA buttons | 700 (bold) | inherit | pattern observe |
| Muted text | 500 (medium) | inherit | pattern observe |

---

## Espacements

### Padding horizontal pages

| Contexte | Valeur | Reference |
|----------|--------|-----------|
| Contenu principal | `px-5` (1.25rem / 20px) | Standard sur toutes les pages |
| Headers gradient | `px-5` | Observe sur Home, Sante, Chat, Scan, etc. |
| Modals/dialogs | `px-6` (1.5rem / 24px) | Padding interne plus large |
| BottomNav | `px-2` | Navigation compacte |
| Onboarding | `px-6` | Plus aere pour le premier contact |

### Padding vertical headers

| Contexte | Classe | Valeur reelle |
|----------|--------|---------------|
| Header standard | `safe-pt-14` | `env(safe-area-inset-top) + 3.5rem` |
| Dashboard | `safe-pt-16` | `env(safe-area-inset-top) + 4rem` |
| Scan (alerte toxic) | `safe-pt-24` | `env(safe-area-inset-top) + 6rem` |
| Footer padding (Layout) | `pb = 6rem + safe-area-inset-bottom` | Espace pour BottomNav |

### Gaps et espacement vertical

| Pattern | Valeur | Usage |
|---------|--------|-------|
| `space-y-5` | 1.25rem | Sections de contenu principales |
| `space-y-4` | 1rem | A l'interieur des cartes |
| `space-y-6` | 1.5rem | Sections VetPortal |
| `gap-4` | 1rem | Flex items dans les cartes |
| `gap-2` | 0.5rem | Items compacts (badges, inline) |
| `mt-8` | 2rem | Offset quand WellnessBanner est present |

---

## Border Radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius` (base) | 0.875rem (14px) | Reference |
| `rounded-sm` | 8px | Petits elements |
| `rounded-md` | 12px | Inputs |
| `rounded-lg` | 14px | Cards standard |
| `rounded-xl` | 18px | Icon containers, nav items |
| `rounded-2xl` | 26px | Boutons CTA, cartes interactives |
| `rounded-3xl` | 1.5rem (24px) | Grandes cartes de contenu, cards home |
| `rounded-full` | 50% | Badges, avatars, indicateurs |

---

## Ombres

| Niveau | Definition | Usage |
|--------|-----------|-------|
| Card repos | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` | Toute carte par defaut (`index.css:161-164`) |
| Card hover | `0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)` | Hover interactif (`index.css:169-172`) |
| CTA buttons | `shadow-lg shadow-primary/30` | Gradient-primary buttons |
| Modal overlay | `shadow-2xl` | Dialogs et celebrations |
| Focus ring | `0 0 0 3px rgba(22,78,62,0.1)` | Inputs en focus (`index.css:244`) |
| Icon shadows | `shadow-lg shadow-{color}-200/50` | Quick action icons sur Home |

---

## Animations (`src/lib/animations.js`)

### Transitions spring

| Preset | Stiffness | Damping | Usage |
|--------|-----------|---------|-------|
| `spring` | 360 | 28 | Default — boutons, cartes, tabs |
| `springGentle` | 120 | 20 | Messages, slide-ins |
| `springSnappy` | 300 | 25 | Expand/collapse, reveals |
| `springTab` | 500 | 35 | BottomNav indicator, tab switches |

### Presets d'interaction

| Preset | Proprietes | Usage |
|--------|-----------|-------|
| `tapScale` | `whileTap: { scale: 0.97 }` | Cards, list items — feedback subtil |
| `pressIn` | `whileTap: { scale: 0.95, opacity: 0.82 }` | CTA buttons — feedback fort |
| `hoverGlow` | `whileHover: { y: -2, boxShadow forest-green }` | Desktop hover lift |

### Presets d'entree

| Preset | Proprietes | Usage |
|--------|-----------|-------|
| `fadeIn` | `opacity: 0 → 1, 240ms easeOut` | Pages, cartes |
| `fadeInUp` | `opacity: 0, y: 20 → 1, 0` | Elements individuels |
| `staggerContainer` | `staggerChildren: 0.08` (80ms) | Parent de listes animees |
| `staggerItem` | `opacity: 0, y: 15 → 1, 0` | Enfants dans stagger |
| `staggerDelay` | `0.05` (50ms) | Delai unitaire pour cascades manuelles |

### Regles

- **Toujours** utiliser les presets de `animations.js` — ne jamais inventer des valeurs inline
- **Toujours** respecter `prefers-reduced-motion` (gere dans `index.css:308-318` + Layout.jsx)
- Page transitions : `fadeIn` via Layout.jsx avec AnimatePresence mode="wait"
- CSS transitions (non-Framer) : `transition-all duration-150` pour les hovers simples

---

## Composants et patterns

### Structure de page standard

```
[WellnessBanner] (fixe, si present → contenu a mt-8)
[Header gradient-primary safe-pt-14 pb-3/pb-8 px-5]
  - Titre blanc, sous-titre white/70
  - Decorative blobs (absolute, blur, opacity faible)
[Content px-5 space-y-5]
  - Cartes empilees
[BottomNav] (fixe, glass morphism)
```

### Header de page

```jsx
<div className="gradient-primary safe-pt-14 pb-3 px-5 relative overflow-hidden">
  {/* Blob decoratif optionnel */}
  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
  <h1 className="text-xl font-bold text-white">{titre}</h1>
  <p className="text-white/70 text-sm mt-1">{sous_titre}</p>
</div>
```

### Carte de contenu (Home)

```jsx
<div className="bg-gradient-to-r from-{color}-50 to-{color}-50/50 rounded-3xl p-4 border border-{color}-100/50 shadow-sm flex items-center gap-4">
  <div className="w-12 h-12 rounded-2xl bg-{color}-100 flex items-center justify-center">
    <Icon className="w-6 h-6 text-{color}-600" />
  </div>
  <div>
    <p className="text-[14px] font-bold text-foreground">{titre}</p>
    <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
    <span className="mt-2 text-[12px] font-bold text-{color}-700 bg-{color}-100 px-3 py-1.5 rounded-full">
      {action}
    </span>
  </div>
</div>
```

### Bouton CTA principal

```jsx
<Button className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base shadow-lg shadow-primary/30">
  {label}
</Button>
```

### Badge

```jsx
<span className="text-[12px] font-bold text-{color}-700 bg-{color}-100 px-3 py-1.5 rounded-full">
  {text}
</span>
```

### BottomNav

- Glass morphism : `rgba(255,255,255,0.85)` + `backdrop-filter: blur(16px) saturate(180%)`
- 5 tabs : Accueil (Home), Sante (Heart), Activite (Activity), Nutrition (Utensils), Profil (User)
- Active indicator : `layoutId="bottomNavIndicator"` + gradient primary→accent + springTab
- Icons : Lucide, stroke-[2.5] active, stroke-[1.75] inactive

### WellnessBanner

- Fixed top, z-40, height 28px + safe-area
- `bg-accent/10 backdrop-blur-sm border-b border-accent/20`
- Text 11px, PawPrint icon 12px
- Pages avec banner : Sante, Nutri, Training, Dashboard
- Pages SANS banner : Home, Chat, Scan, Onboarding, Premium

---

## Comportements natifs (PWA)

| Comportement | Implementation | Reference |
|-------------|---------------|-----------|
| Anti-overscroll | `overscroll-behavior: none` | `index.css:108` |
| Anti-zoom iOS | `font-size: 16px !important` sur inputs | `index.css:119-121` |
| Anti-double-tap | `touch-action: manipulation` | `index.css:124-128` |
| Anti-selection | `user-select: none` sur body, re-enable sur contenu | `index.css:130-156` |
| Anti-drag images | `-webkit-user-drag: none` | `index.css:139-141` |
| Scrollbar fine | 4px, transparent track, border-color thumb | `index.css:100-102` |
| Safe areas | `env(safe-area-inset-*)` partout | Headers, BottomNav, banners |

---

## Dark mode

- Declenchement : `darkMode: "media"` (suit le systeme OS, pas de toggle)
- Tokens remappe : toutes les variables CSS dans `.dark {}` (`index.css:54-73`)
- Fallbacks Tailwind : `.dark .bg-white → card`, `.dark .from-{color}-50` remappes (`index.css:270-305`)
- Bordures adoucies : `border-{color}-200 → hsl(color, 20%, 20%)` en dark

---

## Ne JAMAIS faire

1. **Modifier `src/components/ui/`** — shadcn/ui, untouchable
2. **Modifier les variables CSS** dans `index.css :root` sans validation Ismail
3. **Utiliser orange** — amber uniquement, en contexte warning
4. **Inventer des valeurs d'animation** — utiliser `animations.js`
5. **Oublier safe-area** — toujours `safe-pt-*` sur les headers, `env()` sur BottomNav
6. **Padding horizontal != px-5** sur le contenu principal (sauf exceptions documentees)
7. **Supprimer WellnessBanner** des pages qui l'ont (obligation legale)
8. **Utiliser Inter comme choix par defaut** pour un autre projet — c'est specifique a PawCoach
