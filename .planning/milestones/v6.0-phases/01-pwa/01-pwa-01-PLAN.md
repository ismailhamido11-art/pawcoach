---
phase: 01-pwa
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/manifest.json
  - public/sw.js
autonomous: true
requirements:
  - PWA-01
  - PWA-02

must_haves:
  truths:
    - "public/manifest.json existe avec name, short_name, start_url, display:standalone, theme_color, background_color et deux icones (192x192 + 512x512)"
    - "public/sw.js existe avec un fetch handler qui intercepte les requetes"
    - "Le service worker s'enregistre sans erreur (main.jsx:7-15 execute sans catch)"
    - "L'app est proposee comme installable par le navigateur mobile"
  artifacts:
    - path: "public/manifest.json"
      provides: "Manifeste PWA complet"
      contains: "\"display\": \"standalone\""
    - path: "public/sw.js"
      provides: "Service worker minimal"
      contains: "fetch"
  key_links:
    - from: "index.html"
      to: "public/manifest.json"
      via: "<link rel=\"manifest\" href=\"/manifest.json\">"
      pattern: "manifest.json"
    - from: "src/main.jsx"
      to: "public/sw.js"
      via: "navigator.serviceWorker.register('/sw.js')"
      pattern: "sw\\.js"
---

<objective>
Creer les deux fichiers manquants qui rendent PawCoach installable comme PWA : public/manifest.json et public/sw.js.

Purpose: index.html et main.jsx referent deja ces fichiers (PWA wiring deja en place) mais les fichiers n'existent pas — le navigateur ne peut pas proposer l'installation et le SW echoue silencieusement.
Output: public/manifest.json + public/sw.js dans le bon dossier, prêts a etre servis par Vite.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Creer public/manifest.json</name>
  <files>public/manifest.json</files>
  <read_first>
    - index.html (verifier la reference exacte au manifest et aux meta apple)
    - vite.config.js (confirmer que publicDir est "public" par defaut — aucun custom publicDir)
  </read_first>
  <action>
Creer le dossier public/ s'il n'existe pas, puis creer public/manifest.json avec ce contenu exact (per PWA-01) :

```json
{
  "name": "PawCoach",
  "short_name": "PawCoach",
  "description": "Coach bien-être canin intelligent",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F0E8",
  "theme_color": "#1A4D3E",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/mascot/paw-happy.jpg",
      "sizes": "192x192",
      "type": "image/jpeg",
      "purpose": "any maskable"
    },
    {
      "src": "/mascot/paw-happy.jpg",
      "sizes": "512x512",
      "type": "image/jpeg",
      "purpose": "any maskable"
    }
  ]
}
```

Note sur les icones : l'app n'a pas d'icones PNG/SVG dedies PWA dans public/. On reutilise /mascot/paw-happy.jpg qui existe dans le repo (reference dans index.html ligne 5 et ligne 16). Les deux entrees pointent vers la meme image — acceptable pour une PWA minimale sans avoir a generer de nouveaux assets.

Ne PAS installer vite-plugin-pwa — decision verrouilee : manifest.json et sw.js ecrits manuellement (cf STATE.md).
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('public/manifest.json','utf8')); const ok = m.name==='PawCoach' && m.display==='standalone' && m.theme_color==='#1A4D3E' && m.start_url==='/' && m.icons.length===2; console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({name:m.name,display:m.display,theme_color:m.theme_color,icons:m.icons.length}))"</automated>
  </verify>
  <acceptance_criteria>
    - grep -c "standalone" public/manifest.json retourne 1
    - grep -c "PawCoach" public/manifest.json retourne au moins 2 (name + short_name)
    - grep -c "1A4D3E" public/manifest.json retourne 1
    - grep -c "F5F0E8" public/manifest.json retourne 1
    - grep -c "icons" public/manifest.json retourne au moins 1
  </acceptance_criteria>
  <done>public/manifest.json existe, JSON valide, contient name:"PawCoach", display:"standalone", theme_color:"#1A4D3E", background_color:"#F5F0E8", start_url:"/", et 2 entrees icones.</done>
</task>

<task type="auto">
  <name>Task 2: Creer public/sw.js</name>
  <files>public/sw.js</files>
  <read_first>
    - src/main.jsx (verifier les parametres du register : scope et nom du fichier)
  </read_first>
  <action>
Creer public/sw.js avec un service worker minimal (per PWA-02) :

```js
// PawCoach Service Worker — minimal passthrough + cache-first for static assets
const CACHE_NAME = 'pawcoach-v1';

// Install: skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch: passthrough (no offline strategy — app requires auth)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Pass through — no caching for now (Base44 app requires live auth)
  event.respondWith(fetch(event.request));
});
```

Pourquoi passthrough et pas cache-first : l'app Base44 requiert une authentification active. Mettre en cache les reponses API ou les pages provoquerait des boucles d'auth cassees. Le SW minimal garantit l'installabilite sans risquer de casser le flow de connexion.

Ne PAS ajouter de logique de cache complexe, d'offline fallback ou de precaching — hors scope PWA-02.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const sw=fs.readFileSync('public/sw.js','utf8'); const ok = sw.includes('fetch') && sw.includes('install') && sw.includes('activate'); console.log(ok ? 'PASS' : 'FAIL')"</automated>
  </verify>
  <acceptance_criteria>
    - grep -c "addEventListener" public/sw.js retourne au moins 3 (install, activate, fetch)
    - grep -c "fetch" public/sw.js retourne au moins 2 (event listener + respondWith)
    - grep -c "skipWaiting" public/sw.js retourne 1
  </acceptance_criteria>
  <done>public/sw.js existe, contient les trois event listeners (install, activate, fetch), skipWaiting() et clients.claim() appeles, fetch passthrough en place.</done>
</task>

</tasks>

<verification>
Apres execution des deux tasks :

1. Les deux fichiers existent : `ls public/manifest.json public/sw.js` retourne les deux sans erreur
2. manifest.json est JSON valide : `node -e "JSON.parse(require('fs').readFileSync('public/manifest.json','utf8')); console.log('valid JSON')"`
3. sw.js contient les 3 listeners : `grep -c addEventListener public/sw.js` retourne 3
4. La reference dans index.html pointe vers le bon chemin : `grep manifest index.html` montre `/manifest.json`
5. La registration dans main.jsx pointe vers le bon chemin : `grep sw.js src/main.jsx` montre `/sw.js`

Verification manuelle (optionnelle) : ouvrir DevTools > Application > Manifest sur la version deployee — le manifeste doit etre parse correctement. Service Workers > doit afficher l'etat "activated and is running".
</verification>

<success_criteria>
1. public/manifest.json existe avec name:"PawCoach", display:"standalone", theme_color:"#1A4D3E", background_color:"#F5F0E8", start_url:"/", 2 icones
2. public/sw.js existe avec les 3 event listeners (install, activate, fetch) et passthrough fetch
3. Les deux fichiers JSON valides / JS sans erreur de syntaxe
4. Aucune modification de index.html ou main.jsx necessaire (wiring deja en place)
</success_criteria>

<output>
After completion, create `.planning/phases/01-pwa/01-pwa-01-SUMMARY.md`
</output>
