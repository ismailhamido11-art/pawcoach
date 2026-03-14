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
import Activite from './pages/Activite';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import DogProfile from './pages/DogProfile';
import DogPublicProfile from './pages/DogPublicProfile';
// FROZEN — orphan page, Three.js too heavy (~600KB). Uncomment only if DogTwin is re-linked in the app.
// import DogTwin from './pages/DogTwin';
import HealthImport from './pages/HealthImport';
import Home from './pages/Home';
import Library from './pages/Library';
import Nutri from './pages/Nutri';
import Onboarding from './pages/Onboarding';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Sante from './pages/Sante';
import Scan from './pages/Scan';
import Training from './pages/Training';
import VetDogView from './pages/VetDogView';
import VetPortal from './pages/VetPortal';
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