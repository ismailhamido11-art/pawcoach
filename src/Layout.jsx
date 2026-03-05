import { useEffect } from "react";
import ReminderAlert from "./components/reminders/ReminderAlert";

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
      <ReminderAlert />
      <div key={currentPageName} className="page-enter pb-24">
        {children}
      </div>
    </>
  );
}