import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import { getTodayString } from "@/utils/recommendations";

export const MSG_DAILY_LIMIT = 10;
export const ACTION_DAILY_LIMIT = 3;

/**
 * Initialize / daily-reset credits for a free user.
 * Handles both message pool and action pool.
 * Returns { msgCredits, actionCredits }
 */
export async function initCredits(user) {
  const today = getTodayString();
  const updates = {};

  // --- Message credits ---
  let msgCredits = user.messages_remaining;
  if (msgCredits == null) {
    msgCredits = MSG_DAILY_LIMIT;
    updates.messages_remaining = MSG_DAILY_LIMIT;
    updates.messages_daily_reset = today;
  } else if (msgCredits <= 0 && user.messages_daily_reset !== today) {
    msgCredits = MSG_DAILY_LIMIT;
    updates.messages_remaining = MSG_DAILY_LIMIT;
    updates.messages_daily_reset = today;
  }

  // --- Action credits ---
  let actionCredits = user.actions_remaining;
  if (actionCredits == null) {
    actionCredits = ACTION_DAILY_LIMIT;
    updates.actions_remaining = ACTION_DAILY_LIMIT;
    updates.actions_daily_reset = today;
  } else if (actionCredits <= 0 && user.actions_daily_reset !== today) {
    actionCredits = ACTION_DAILY_LIMIT;
    updates.actions_remaining = ACTION_DAILY_LIMIT;
    updates.actions_daily_reset = today;
  }

  if (Object.keys(updates).length > 0) {
    try {
      await base44.auth.updateMe(updates);
    } catch (e) {
      console.warn("ai-credits: updateMe failed — actions_remaining field may need schema update", e);
    }
  }

  return { msgCredits, actionCredits };
}

/**
 * Consume one message credit. Returns new remaining count.
 */
export async function consumeMessageCredit(currentRemaining) {
  const newRemaining = Math.max(0, (currentRemaining ?? 0) - 1);
  await base44.auth.updateMe({
    messages_remaining: newRemaining,
    messages_daily_reset: getTodayString(),
  });
  return newRemaining;
}

/**
 * Consume one action credit. Returns new remaining count.
 */
export async function consumeActionCredit(currentRemaining) {
  const newRemaining = Math.max(0, (currentRemaining ?? 0) - 1);
  try {
    await base44.auth.updateMe({
      actions_remaining: newRemaining,
      actions_daily_reset: getTodayString(),
    });
  } catch (e) {
    console.warn("ai-credits: consumeActionCredit failed", e);
  }
  return newRemaining;
}

/**
 * Hook for action credit gating in any component.
 * Self-contained: loads user, checks premium, manages credits.
 */
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
