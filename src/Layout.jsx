import { useEffect } from "react";
import NotificationCenter from "./components/notifications/NotificationCenter";

export default function Layout({ children, currentPageName }) {
  // Dark mode detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => {
      if (e.matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <style>{`
        body { overscroll-behavior-y: none; }
        button, [role="button"], a, nav, nav * {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          -webkit-user-select: none;
        }
        input, textarea, select {
          font-size: 16px !important;
        }
      `}</style>
      {/* Floating bell button top-right — hidden on DogProfile */}
      {currentPageName !== "DogProfile" && (
        <div
          className="fixed top-0 right-0 z-50 flex items-center"
          style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 6px) + 28px + env(safe-area-inset-top, 0px))", paddingRight: "12px" }}
        >
          <NotificationCenter />
        </div>
      )}
      <div key={currentPageName} className="page-enter pb-24">
        {children}
      </div>
    </>
  );
}