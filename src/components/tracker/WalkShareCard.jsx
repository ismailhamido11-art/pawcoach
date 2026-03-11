import { useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Download, Share2 } from "lucide-react";

function getWalkLevel(minutes) {
  if (minutes >= 45) return { label: "SUPER BALADE", emoji: "🏆", bg: "linear-gradient(135deg, #064e3b, #059669)", accent: "#34d399" };
  if (minutes >= 30) return { label: "OBJECTIF ATTEINT", emoji: "🎯", bg: "linear-gradient(135deg, #1a4d3e, #2d9f82)", accent: "#6ee7b7" };
  if (minutes >= 15) return { label: "BONNE BALADE", emoji: "🐾", bg: "linear-gradient(135deg, #1e3a5f, #3b82f6)", accent: "#93c5fd" };
  return { label: "PETITE SORTIE", emoji: "🐕", bg: "linear-gradient(135deg, #374151, #6b7280)", accent: "#d1d5db" };
}

export default function WalkShareCard({ minutes, km, calories, dogName, streak, kibbleEquiv, onClose }) {
  const cardRef = useRef();
  const level = getWalkLevel(minutes);

  const renderToCanvas = async () => {
    const { default: html2canvas } = await import("html2canvas");
    return html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      width: 540,
      height: 540,
    });
  };

  const downloadCard = async () => {
    const canvas = await renderToCanvas();
    const link = document.createElement("a");
    link.download = `pawcoach-balade-${dogName?.replace(/\s+/g, "-") || "walk"}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareCard = async () => {
    try {
      const canvas = await renderToCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "pawcoach-balade.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Balade avec ${dogName || "mon chien"} — PawCoach`,
          text: `${level.emoji} ${minutes} min de balade avec ${dogName || "mon chien"}${km ? ` (${km} km)` : ""} ! Suis nos aventures sur PawCoach.`,
        });
      } else {
        downloadCard();
      }
    } catch (e) {
      if (e.name !== "AbortError") downloadCard();
    }
  };

  const stats = [
    { value: `${minutes}`, unit: "min", label: "Durée" },
  ];
  if (km) stats.push({ value: km, unit: "km", label: "Distance" });
  stats.push({ value: `${calories}`, unit: "cal", label: "Calories" });

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-[320px] space-y-4" onClick={e => e.stopPropagation()}>
        {/* 1:1 viral card — scaled preview */}
        <div style={{ width: 540 * 0.56, height: 540 * 0.56, overflow: "hidden", borderRadius: 27 }}>
          <div
            ref={cardRef}
            style={{
              width: 540,
              height: 540,
              background: level.bg,
              transform: "scale(0.56)",
              transformOrigin: "top left",
              borderRadius: 48,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Decorative elements */}
            <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", top: 80, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "36px 32px", textAlign: "center" }}>
              {/* Emoji */}
              <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>{level.emoji}</div>

              {/* Level badge */}
              <div style={{
                display: "inline-block",
                padding: "6px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                border: `2px solid ${level.accent}`,
                marginBottom: 16,
              }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 2, textTransform: "uppercase" }}>
                  {level.label}
                </span>
              </div>

              {/* Dog name */}
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, fontWeight: 700, marginBottom: 24 }}>
                Balade avec {dogName || "mon chien"}
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 20, justifyContent: "center", alignItems: "flex-start", marginBottom: 20 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: stats.length <= 2 ? 100 : 88,
                      height: stats.length <= 2 ? 100 : 88,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.12)",
                      border: `2px solid ${level.accent}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: stats.length <= 2 ? 30 : 26, lineHeight: 1 }}>{s.value}</span>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, marginTop: 2 }}>{s.unit}</span>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginTop: 6 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Streak */}
              {streak && (
                <div style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  marginBottom: 8,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>
                    {streak}
                  </span>
                </div>
              )}

              {/* Kibble equivalent */}
              {kibbleEquiv > 0 && (
                <div style={{
                  padding: "5px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>
                    🦴 = {kibbleEquiv} croquettes brûlées
                  </span>
                </div>
              )}

              {/* PawCoach branding */}
              <div style={{
                position: "absolute",
                bottom: 22,
                left: 0,
                right: 0,
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🐾</span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                    PawCoach
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={downloadCard} className="h-14 rounded-2xl gap-2 bg-white">
            <Download className="w-4 h-4" /> Enregistrer
          </Button>
          <Button onClick={shareCard} className="h-14 rounded-2xl gap-2 gradient-primary border-0 text-white">
            <Share2 className="w-4 h-4" /> Partager
          </Button>
        </div>
        <button onClick={onClose} className="flex items-center justify-center gap-1 w-full text-sm text-white/80">
          <X className="w-4 h-4" /> Fermer
        </button>
      </div>
    </div>,
    document.body
  );
}
