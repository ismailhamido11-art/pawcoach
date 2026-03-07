import { useEffect } from "react";

/**
 * Listens for the browser's popstate event (back button) and calls onClose
 * when the given `isOpen` flag is true. Pushes a dummy history entry when
 * the modal opens so the back gesture can be intercepted.
 */
export default function useBackClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    // Push a state so the back button has something to pop
    window.history.pushState({ modal: true }, "");

    const handlePop = () => {
      onClose?.();
    };

    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
    };
  }, [isOpen]);
}