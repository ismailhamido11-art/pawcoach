import { useEffect, useRef } from "react";

/**
 * Makes the browser back button/gesture close a modal instead of navigating away.
 * Pushes a history entry when the modal opens; pops it on back press.
 *
 * @param {boolean} open - Whether the modal is currently open
 * @param {Function} onClose - Function to close the modal
 */
export default function useBackClose(open, onClose) {
  const pushed = useRef(false);
  const onCloseRef = useRef(onClose);
  const isUnmounting = useRef(false);
  onCloseRef.current = onClose;

  // Track component unmount
  useEffect(() => () => { isUnmounting.current = true; }, []);

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ __modal: true }, "");
    pushed.current = true;

    const handlePop = () => {
      pushed.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      // Clean up extra history entry only if modal closed normally (not on page unmount)
      if (pushed.current && !isUnmounting.current) {
        pushed.current = false;
        window.history.back();
      }
    };
  }, [open]);
}
