/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';

// BottomNav — toujours dans le bundle initial (chargement immédiat garanti)
import Activite from './pages/Activite';
import Home from './pages/Home';
import Nutri from './pages/Nutri';
import Profile from './pages/Profile';
import Sante from './pages/Sante';

// Pages secondaires — lazy (chargées à la demande)
// FROZEN — orphan page, Three.js too heavy (~600KB). Uncomment only if DogTwin is re-linked in the app.
// const DogTwin = lazy(() => import('./pages/DogTwin'));
const Chat = lazy(() => import('./pages/Chat'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DogProfile = lazy(() => import('./pages/DogProfile'));
const DogPublicProfile = lazy(() => import('./pages/DogPublicProfile'));
const HealthImport = lazy(() => import('./pages/HealthImport'));
const Library = lazy(() => import('./pages/Library'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Premium = lazy(() => import('./pages/Premium'));
const Scan = lazy(() => import('./pages/Scan'));
const Training = lazy(() => import('./pages/Training'));
const VetDogView = lazy(() => import('./pages/VetDogView'));
const VetPortal = lazy(() => import('./pages/VetPortal'));

import __Layout from './Layout.jsx';


export const PAGES = {
    "Activite": Activite,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "DogProfile": DogProfile,
    "DogPublicProfile": DogPublicProfile,
    // "DogTwin": DogTwin, // FROZEN — see import comment above
    "HealthImport": HealthImport,
    "Home": Home,
    "Library": Library,
    "Nutri": Nutri,
    "Onboarding": Onboarding,
    "Premium": Premium,
    "Profile": Profile,
    "Sante": Sante,
    "Scan": Scan,
    "Training": Training,
    "VetDogView": VetDogView,
    "VetPortal": VetPortal,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};