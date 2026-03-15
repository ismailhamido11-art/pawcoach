import { useEffect } from "react";

export default function useBackClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => onClose();
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);
}