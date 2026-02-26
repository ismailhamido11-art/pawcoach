import WellnessBanner from "./components/WellnessBanner";
import BottomNav from "./components/BottomNav";

// Pages that have their own layout handling (banner + nav built-in)
const SELF_CONTAINED = ["Home", "Scan", "Chat", "Training", "Notebook"];

export default function Layout({ children, currentPageName }) {
  // These pages manage their own banner and nav
  if (SELF_CONTAINED.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Onboarding and other pages: no bottom nav, no banner interference
  return <>{children}</>;
}