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
  } else if (user.messages_daily_reset !== today) {
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
  } else if (user.actions_daily_reset !== today) {
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

export { useActionCredits } from "@/hooks/useActionCredits";