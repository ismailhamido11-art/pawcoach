import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import StorysetIllustration from "@/components/ui/StorysetIllustration";

function Bone({ className }) {
  return <Skeleton className={cn("rounded-xl bg-primary/10", className)} />;
}

function SkeletonCard({ className, lines = 3 }) {
  return (
    <div className={cn("rounded-3xl border border-border/50 bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        <Bone className="h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-1/3" />
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Bone key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

function SkeletonHero({ titleWidth = "w-32", withTabs = false, tabs = 4 }) {
  return (
    <div className="gradient-primary px-5 safe-pt-14 pb-4 relative overflow-hidden mt-8">
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-end gap-3 mb-4">
        <div className="flex-1 pb-1">
          <Bone className="h-3 w-16 bg-white/20 mb-2" />
          <Bone className={cn("h-7 bg-white/20", titleWidth)} />
          <Bone className="h-3 w-36 bg-white/10 mt-2" />
        </div>

        <div className="w-24 h-24 flex-shrink-0 rounded-[2rem] bg-white/10 border border-white/10 flex items-center justify-center p-4">
          <StorysetIllustration name="welcome" alt="" className="w-full h-full opacity-70" />
        </div>
      </div>

      {withTabs && (
        <div className={`grid gap-1.5 mt-1 ${tabs === 5 ? "grid-cols-5" : tabs === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {Array.from({ length: tabs }).map((_, index) => (
            <Bone key={index} className="h-16 rounded-2xl bg-white/10" />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Bone className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function SkeletonChat() {
  return (
    <div className="flex-1 px-4 pt-6 pb-24 space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={cn("flex", index % 2 === 0 ? "justify-start" : "justify-end")}>
          <div className={cn("max-w-[80%] rounded-3xl border border-border/40 p-4 shadow-sm", index % 2 === 0 ? "bg-card" : "bg-primary/10")}>
            <div className="space-y-2">
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonPage({ variant = "list", className = "", currentPage }) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.22, ease: "easeOut" },
      };

  return (
    <motion.div {...motionProps} className={cn("min-h-screen bg-background pb-28", className)}>
      {(variant === "stats" || variant === "list" || variant === "detail") && (
        <SkeletonHero
          titleWidth={variant === "detail" ? "w-40" : "w-28"}
          withTabs={variant === "stats"}
          tabs={currentPage === "Sante" ? 5 : currentPage === "Activite" ? 4 : 4}
        />
      )}

      {variant === "stats" && (
        <div className="space-y-4 pt-4">
          <SkeletonStats />
          <SkeletonList count={3} />
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-4 pt-5">
          <div className="px-4 space-y-2">
            <Bone className="h-4 w-24" />
            <Bone className="h-10 w-full rounded-2xl" />
          </div>
          <SkeletonList count={4} />
        </div>
      )}

      {variant === "detail" && (
        <div className="space-y-4 px-4 pt-5">
          <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Bone className="h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-32" />
                <Bone className="h-3 w-24" />
                <Bone className="h-3 w-40" />
              </div>
            </div>
          </div>
          <SkeletonList count={4} />
        </div>
      )}

      {variant === "chat" && (
        <div className="flex min-h-screen flex-col bg-background">
          <div className="border-b border-border/50 bg-card/70 px-4 pb-4 pt-8 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Bone className="h-11 w-11 rounded-2xl" />
              <div className="space-y-2">
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-32" />
              </div>
            </div>
          </div>
          <SkeletonChat />
        </div>
      )}
    </motion.div>
  );
}

export { Bone, SkeletonCard, SkeletonHero, SkeletonList, SkeletonStats };