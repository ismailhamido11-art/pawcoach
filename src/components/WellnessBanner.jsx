import { PawPrint } from "lucide-react";

export default function WellnessBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-accent/10 backdrop-blur-sm border-b border-accent/20 px-5 text-center flex items-center justify-center"
      style={{
        paddingTop: "max(6px, env(safe-area-inset-top, 0px))",
        paddingLeft: "max(20px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(20px, env(safe-area-inset-right, 0px))",
        height: "calc(28px + max(6px, env(safe-area-inset-top, 0px)))"
      }}
    >
      <p className="text-[11px] text-accent-foreground font-medium flex items-center gap-1">
        <PawPrint className="w-3 h-3 flex-shrink-0" /> PawCoach est un coach bien-être, pas un vétérinaire.
      </p>
    </div>
  );
}