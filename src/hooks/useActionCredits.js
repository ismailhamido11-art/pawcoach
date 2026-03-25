import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import { initCredits, consumeActionCredit } from "@/utils/ai-credits";

export function useActionCredits() {
  const [credits, setCredits] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (isUserPremium(user)) {
          setIsPremium(true);
          setCredits(Infinity);
        } else {
          const { actionCredits } = await initCredits(user);
          setCredits(actionCredits);
        }
      } catch {
        setCredits(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const consume = async () => {
    if (isPremium) return true;
    if ((credits ?? 0) <= 0) return false;
    const newRemaining = await consumeActionCredit(credits);
    setCredits(newRemaining);
    return true;
  };

  const hasCredits = isPremium || (credits ?? 0) > 0;

  return { credits, hasCredits, isPremium, loading, consume };
}