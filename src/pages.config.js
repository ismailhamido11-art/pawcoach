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
import DogProfile from './pages/DogProfile';
import FindVet from './pages/FindVet';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Activite from './pages/Activite';
import Sante from './pages/Sante';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import DogPublicProfile from './pages/DogPublicProfile';
import DogTwin from './pages/DogTwin';
import HealthImport from './pages/HealthImport';
import Library from './pages/Library';
import Nutri from './pages/Nutri';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import Tracker from './pages/Tracker';
import Training from './pages/Training';
import VetDogView from './pages/VetDogView';
import VetPortal from './pages/VetPortal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DogProfile": DogProfile,
    "FindVet": FindVet,
    "Home": Home,
    "Onboarding": Onboarding,
    "Activite": Activite,
    "Sante": Sante,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "DogPublicProfile": DogPublicProfile,
    "DogTwin": DogTwin,
    "HealthImport": HealthImport,
    "Library": Library,
    "Nutri": Nutri,
    "Premium": Premium,
    "Profile": Profile,
    "Scan": Scan,
    "Tracker": Tracker,
    "Training": Training,
    "VetDogView": VetDogView,
    "VetPortal": VetPortal,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};