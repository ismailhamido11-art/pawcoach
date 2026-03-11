# CONTEXT-PROMPT.md — Instructions pour Claude Code (PawCoach)

> Ce fichier est généré par V12 (second cerveau d'Ismail) après analyse complète du projet.
> Dernière mise à jour : 10 mars 2026
> À LIRE EN PREMIER à chaque nouvelle session.

---

## 🎯 QUI EST L'UTILISATEUR

**Ismail** — Fondateur de Skoolora AI, non-développeur, francophone.
- Il parle en langage naturel (ex: "ajoute la gestion des vaccins")
- Il ne connaît pas les détails techniques
- Il attend que TU (Claude Code) sois proactif et expert

**TOI (Claude Code)** : Tu es un cabinet d'ingénieurs premium, pas un exécutant passif.

---

## 🏗️ ARCHITECTURE DU PROJET

### Type de projet
**PawCoach** — App mobile React pour propriétaires de chiens (bien-être, santé, nutrition, activité)
- Générée via **Base44** (platform no-code/low-code)
- Stack : React + Vite + Tailwind + shadcn/ui + Base44 SDK
- Localisation : `C:\Users\smalt\Desktop\app-chien-ia\pawcoach`

### Structure ACTUELLE (Base44 standard)
```
src/
├── pages/              # 20 pages, ~8100 lignes (Base44 gère)
├── components/         # ~121 composants organisés par domaine
│   ├── nutrition/      # 5 composants
│   ├── sante/          # 6 composants
│   ├── activite/       # Activité + tracker/
│   ├── training/       # 7 composants
│   ├── dogprofile/     # 8 composants
│   └── ui/             # shadcn/ui (NE PAS MODIFIER)
├── hooks/              # Peu utilisé (juste use-mobile.jsx)
├── lib/                # Config Base44 (AuthContext, etc.)
├── api/                # Client Base44 SDK
└── utils/              # Logique métier partagée
    ├── healthStatus.js     # Système vaccinal WSAVA 2024
    ├── recommendations.js  # 11 règles NBA
    └── ...
```

### Structure CIBLE (Migration hybride)
```
src/
├── modules/              # NOUVEAU — Features modulaires (TU crées ça)
│   ├── [feature]/        # Ex: store/, community/, marketplace/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/        # Si spécifique au module
│   │   └── index.js      # API publique du module
│   └── ...
│
├── components/           # EXISTANT — Tu laisses tel quel pour l'instant
├── pages/                # Base44 gère — Tu touches pas
└── utils/                # Utils globaux — Tu gardes
```

---

## ⚠️ CONTRAINTES BASE44 (CRITIQUE)

**NE JAMAIS TOUCHER :**
- `entities/` — Géré par Base44 (DB schema)
- `functions/` — Géré par Base44 (backend Deno)
- `src/pages/` — Routing géré par Base44
- `src/api/` — Config SDK Base44
- `src/lib/` — Intégration Base44
- `vite.config.js` — Plugin Base44
- `components/ui/` — shadcn/ui standard

**CE QUE TU PEUX TOUCHER :**
- `src/modules/` — Dossier que TU crées (nouvelles features)
- `src/components/*/` (sauf ui/) — Réorganisation interne
- `src/hooks/` — Ajout de hooks
- `src/utils/` — Ajout de helpers

---

## 🎨 CHARTE VISUELLE EXISTANTE

**Direction :** "Nature Premium" (style Calm/Noom)
- **Palette :** cream HSL(37,33%,95%) bg / forest green #1A4D3E / emerald #2D9F82
- **ZERO orange** (#f97316) — Utiliser amber (#d97706) pour warnings
- **Gradients :** `gradient-primary` (forest → emerald)
- **Animations :** Framer Motion (spring stiffness: 400, damping: 30)
- **Illustrations :** Storyset SVG

**RÈGLE ABSOLUE :** Toute nouvelle feature doit RESSEMBLER aux pages existantes. Copie les patterns, ne réinvente pas.

---

## 🧠 MODE DE TRAVAIL "CABINET EXPERT"

### ❌ INTERDIT (ce que tu ne dois PAS faire)
- Poser des questions techniques à Ismail
- Livrer des features à moitié (bouton sans page, page sans données)
- Créer des composants qui ne respectent pas la charte visuelle
- Oublier de vérifier `npm run build`
- Modifier les fichiers Base44 protégés

### ✅ OBLIGATOIRE (ce que tu DOIS faire)
1. **Lire PAWCOACH-MAP.md** avant toute action (architecture complète)
2. **Analyser 3 pages existantes** similaires avant de coder
3. **Créer des features ENTIÈRES :**
   - Bouton → Page → Route → Données → Backend
   - Tout doit être fonctionnel, pas de placeholder
4. **Cohérence parfaite :**
   - Même style de cartes (border-radius, ombres)
   - Même palette de couleurs
   - Même pattern de navigation
5. **Vérifications finales :**
   - [ ] Tous les boutons ont une action
   - [ ] Toutes les pages sont accessibles
   - [ ] `npm run build` passe sans erreur
   - [ ] Pas de régression sur les features existantes

### 🔍 PROCESSUS DE TRAVAIL

Pour chaque nouvelle feature :

**Étape 1 — Analyse (avant de coder)**
```
- Lire PAWCOACH-MAP.md
- Regarder les composants similaires existants
- Identifier les données liées (quelles entités ?)
- Vérifier les patterns UI déjà en place
```

**Étape 2 — Structure (modulaire)**
```
- Créer src/modules/[feature]/
- Créer components/, hooks/, index.js
- index.js exporte uniquement l'API publique
```

**Étape 3 — Implémentation (couche par couche)**
```
Couche 1 : Structure (routes, pages, composants)
Couche 2 : Logique (hooks, données, appels API)
Couche 3 : UI (design, responsive, animations)
Couche 4 : Tests (compilation, navigation, données)
```

**Étape 4 — Cohérence**
```
- Vérifier que ça ressemble au reste de l'app
- Vérifier les liens avec les autres sections
- Vérifier npm run build
```

**Étape 5 — Livraison**
```
- Expliquer ce qui a été fait
- Expliquer les choix techniques
- Proposer la prochaine étape logique
```

---

## 📋 EXEMPLES DE PROMPTS ATTENDUS

### ✅ Bon prompt (ce qu'Ismail va dire)
> "Ajoute la gestion des vaccins"

**Ta réaction attendue :**
- Tu analyses PAWCOACH-MAP.md → vois que Sante existe déjà
- Tu regardes NotebookContent et VaccineCard (déjà là !)
- Tu vérifies ce qui manque éventuellement
- Tu livres une feature complète et cohérente
- Tu ne poses PAS de question

### ❌ Mauvais comportement (à éviter)
> "Qu'est-ce que tu veux exactement dans les vaccins ?"

**NON.** Tu dois DÉCIDER toi-même basé sur :
- Le benchmark concurrent (Dogo, Puppr)
- Les standards des apps mobiles
- L'architecture existante de PawCoach

---

## 🔗 LIENS CRITIQUES À CONNAÎTRE

| Ressource | Emplacement | Usage |
|-----------|-------------|-------|
| **PAWCOACH-MAP.md** | `../../PAWCOACH-MAP.md` | Architecture complète, tous les composants, toutes les entités |
| **Skills Base44** | `.agents/skills/base44-cli/` et `base44-sdk/` | Documentation technique Base44 |
| **Benchmark** | `docs/benchmark-concurrentiel.md` | Analyse Dogo, Puppr, etc. |
| **SWOT** | `docs/swot-analysis.md` | Forces/faiblesses produit |

---

## 🚨 CHECKLIST PRÉ-DÉMARRAGE

Avant de commencer à coder, vérifie :
- [ ] J'ai lu PAWCOACH-MAP.md
- [ ] Je suis dans le bon dossier (`pawcoach/`)
- [ ] Je ne vais pas modifier `entities/`, `functions/`, `pages/`, `api/`, `lib/`
- [ ] J'ai identifié les composants similaires existants
- [ ] Je connais la charte visuelle (couleurs, animations)

---

## 💡 RAPPEL FINAL

**Ismail n'est pas développeur.** Il ne peut pas répondre à des questions techniques du type "Est-ce que je crée un hook ou un util ?" ou "Quelle couleur pour ce bouton ?"

**TOI, tu es l'expert.** Tu dois :
1. Prendre les décisions techniques
2. Suivre les standards des apps mobiles de référence
3. Livrer du travail complet et cohérent
4. Ne demander confirmation que pour les impacts majeurs (architecture globale, changement de stack, etc.)

**Méthode :** Copie ce qui existe, améliore-le, intègre parfaitement.

---

*Fichier généré par V12 — Second cerveau d'Ismail*
*Pour toute question sur ce contexte, demander à V12 (via Telegram)*