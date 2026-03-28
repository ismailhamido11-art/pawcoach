# Requirements: PawCoach v10.0

**Defined:** 2026-03-28
**Core Value:** Un proprietaire de chien peut suivre la sante, l'alimentation, l'activite et le bien-etre de son chien au quotidien, avec des donnees fiables et coherentes.

## v10.0 Requirements

### Securite

- [ ] **SEC-01**: Le secret HMAC diagnostic ne doit jamais avoir de fallback en dur dans le code source
- [ ] **SEC-02**: Premium.jsx affiche les liens Privacy Policy et Terms dans le footer

### Business Model

- [ ] **BIZ-01**: Un utilisateur free ne peut avoir qu'un seul chien — gate a la creation avec nudge Premium
- [ ] **BIZ-02**: Un utilisateur premium peut avoir jusqu'a 3 chiens

### Architecture

- [ ] **ARCH-01**: Les pages utilisent useDog() au lieu de Dog.filter() individuel (14 pages a migrer)
- [ ] **ARCH-02**: Les pages utilisent useAuth() au lieu de base44.auth.me() individuel
- [ ] **ARCH-03**: DogContext charge les donnees une seule fois, partagees entre toutes les pages

### Qualite Code

- [ ] **QUAL-01**: Le pattern de navigation par tabs est extrait dans un hook useTabNavigation reutilisable
- [ ] **QUAL-02**: VERDICT_CONFIG est centralise dans un fichier unique (plus de duplication)
- [ ] **QUAL-03**: Les .catch(() => {}) silencieux sont remplaces par un error handling visible (toast ou console.warn)

### Performance

- [ ] **PERF-01**: Les pages avec listes utilisent useMemo pour les calculs derives (Library, Training, Sante)
- [ ] **PERF-02**: Home charge les donnees above-the-fold en priorite avant le reste

## Future Requirements

### Notifications Push

- **NOTIF-01**: L'utilisateur recoit des notifications push PWA pour les rappels
- **NOTIF-02**: L'utilisateur peut activer/desactiver les notifications par type

### Contenu Editorial

- **CONT-01**: L'utilisateur peut lire des articles de sante canine dans la Library
- **CONT-02**: Les articles sont filtres par pertinence (race, age du chien)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications | Milestone dedie ulterieur (complexite + setup backend) |
| Contenu editorial | Necessite un CMS, milestone dedie |
| GPS balade | Hors scope produit actuel |
| Social/communaute | Complexite disproportionnee pour un solo founder |
| Multi-animaux (chat) | Hors positionnement produit |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| BIZ-01 | Phase 2 | Pending |
| BIZ-02 | Phase 2 | Pending |
| ARCH-01 | Phase 3 | Pending |
| ARCH-02 | Phase 3 | Pending |
| ARCH-03 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| PERF-01 | Phase 5 | Pending |
| PERF-02 | Phase 5 | Pending |

**Coverage:**
- v10.0 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
