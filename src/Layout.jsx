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
          -webkit-touch-callout: none;
          user-select: none;
          -webkit-user-select: none;
        }
        /* Allow text selection in chat/journal areas */
        .chat-bubble-assistant, .chat-bubble-user, [data-selectable] {
          -webkit-user-select: text;
          user-select: text;
        }
        input, textarea, select {
          font-size: 16px !important;
        }
        /* Prevent decorative elements from being draggable */
        img[class*="drop-shadow"], [class*="illustration"] {
          pointer-events: none;
          -webkit-user-drag: none;
        }
      `}</style>
      {/* Floating bell button top-right — hidden on DogProfile */}
      {currentPageName !== "DogProfile" && (
        <div
          className="fixed top-0 right-0 z-50 flex items-center"
          style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 12px) + 28px)", paddingRight: "max(12px, env(safe-area-inset-right, 0px))" }}
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