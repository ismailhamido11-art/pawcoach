import { cn } from "@/lib/utils";

const STORYSET = {
  achievement: new URL("../../assets/illustrations/storyset/achievement.svg", import.meta.url).href,
  calendar: new URL("../../assets/illustrations/storyset/calendar.svg", import.meta.url).href,
  community: new URL("../../assets/illustrations/storyset/community.svg", import.meta.url).href,
  cooking: new URL("../../assets/illustrations/storyset/cooking.svg", import.meta.url).href,
  diagnosis: new URL("../../assets/illustrations/storyset/diagnosis.svg", import.meta.url).href,
  error: new URL("../../assets/illustrations/storyset/error.svg", import.meta.url).href,
  examination: new URL("../../assets/illustrations/storyset/examination.svg", import.meta.url).href,
  feeding: new URL("../../assets/illustrations/storyset/feeding.svg", import.meta.url).href,
  growth: new URL("../../assets/illustrations/storyset/growth.svg", import.meta.url).href,
  "health-record": new URL("../../assets/illustrations/storyset/health-record.svg", import.meta.url).href,
  "healthy-food": new URL("../../assets/illustrations/storyset/healthy-food.svg", import.meta.url).href,
  "meal-plan": new URL("../../assets/illustrations/storyset/meal-plan.svg", import.meta.url).href,
  "no-results": new URL("../../assets/illustrations/storyset/no-results.svg", import.meta.url).href,
  "onboarding-1": new URL("../../assets/illustrations/storyset/onboarding-1.svg", import.meta.url).href,
  playing: new URL("../../assets/illustrations/storyset/playing.svg", import.meta.url).href,
  premium: new URL("../../assets/illustrations/storyset/premium.svg", import.meta.url).href,
  running: new URL("../../assets/illustrations/storyset/running.svg", import.meta.url).href,
  search: new URL("../../assets/illustrations/storyset/search.svg", import.meta.url).href,
  success: new URL("../../assets/illustrations/storyset/success.svg", import.meta.url).href,
  training: new URL("../../assets/illustrations/storyset/training.svg", import.meta.url).href,
  "vet-checkup": new URL("../../assets/illustrations/storyset/vet-checkup.svg", import.meta.url).href,
  walking: new URL("../../assets/illustrations/storyset/walking.svg", import.meta.url).href,
  welcome: new URL("../../assets/illustrations/storyset/welcome.svg", import.meta.url).href,
};

export default function StorysetIllustration({ name, alt, className = "" }) {
  const src = STORYSET[name];
  if (!src) return null;

  const computedAlt = alt !== undefined ? alt : name.replace(/-/g, " ");

  return (
    <img
      src={src}
      alt={computedAlt}
      className={cn("select-none", className)}
      loading="lazy"
      draggable={false}
      {...(computedAlt === "" ? { "aria-hidden": "true" } : {})}
    />
  );
}

export { STORYSET };
