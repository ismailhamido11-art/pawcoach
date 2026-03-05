export default function WellnessBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-accent/10 backdrop-blur-sm border-b border-accent/20 px-5 text-center flex items-center justify-center"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", height: "calc(28px + env(safe-area-inset-top, 0px))" }}
    >
      <p className="text-[10px] text-accent-foreground font-medium">
        🐾 PawCoach est un coach bien-être, pas un vétérinaire.
      </p>
    </div>
  );
}