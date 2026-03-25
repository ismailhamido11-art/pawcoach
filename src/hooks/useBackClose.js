import { useEffect, useRef } from "react";

/**
 * Makes the browser back button/gesture close a modal instead of navigating away.
 * Pushes a history entry when the modal opens; pops it on back press.
 */
export default function useBackClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      if (onCloseRef.current) onCloseRef.current();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);
}