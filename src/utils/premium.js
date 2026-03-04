/**
 * Check if user has premium access (paid OR trial active).
 */
export function isUserPremium(user) {
  if (!user) return false;
  if (user.is_premium) return true;
  if (user.trial_expires_at) {
    return new Date(user.trial_expires_at) > new Date();
  }
  return false;
}

/**
 * Get remaining trial days. Returns 0 if no trial or expired.
 */
export function getTrialDaysLeft(user) {
  if (!user?.trial_expires_at || user?.is_premium) return 0;
  const diff = new Date(user.trial_expires_at) - new Date();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
