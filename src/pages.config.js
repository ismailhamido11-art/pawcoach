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
import Chat from './pages/Chat';
import Home from './pages/Home';
import Notebook from './pages/Notebook';
import Nutrition from './pages/Nutrition';
import Onboarding from './pages/Onboarding';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import Training from './pages/Training';
import VetDogView from './pages/VetDogView';
import VetPortal from './pages/VetPortal';
import FindVet from './pages/FindVet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Home": Home,
    "Notebook": Notebook,
    "Nutrition": Nutrition,
    "Onboarding": Onboarding,
    "Premium": Premium,
    "Profile": Profile,
    "Scan": Scan,
    "Training": Training,
    "VetDogView": VetDogView,
    "VetPortal": VetPortal,
    "FindVet": FindVet,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};