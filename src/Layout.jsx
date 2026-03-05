import { useEffect } from "react";

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
      `}</style>
      <div key={currentPageName} className="page-enter">
        {children}
      </div>
    </>
  );
}