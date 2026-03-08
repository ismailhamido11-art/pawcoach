import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share2 } from "lucide-react";

const VERDICT_STYLE = {
  safe:    { label: "SANS DANGER", emoji: "✅", bg: "linear-gradient(135deg, #065f46, #10b981)", accent: "#34d399", ring: "#22c55e" },
  caution: { label: "AVEC PRECAUTION", emoji: "⚠️", bg: "linear-gradient(135deg, #78350f, #d97706)", accent: "#fbbf24", ring: "#d97706" },
  toxic:   { label: "TOXIQUE", emoji: "💀", bg: "linear-gradient(135deg, #7f1d1d, #ef4444)", accent: "#f87171", ring: "#ef4444" },
};

export default function ShareCard({ result, dogName, onClose }) {
  const cardRef = useRef();
  const s = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.caution;

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
    link.download = `pawcoach-${result.food_name?.replace(/\s+/g, "-") || "scan"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareCard = async () => {
    try {
      const canvas = await renderToCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "pawcoach-scan.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${result.food_name} — PawCoach`,
          text: `${s.emoji} ${result.food_name} est ${s.label.toLowerCase()} pour ${dogName || "mon chien"} ! Verifie avec PawCoach.`,
        });
      } else {
        downloadCard();
      }
    } catch (e) {
      if (e.name !== "AbortError") downloadCard();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-[320px] space-y-4" onClick={e => e.stopPropagation()}>
        {/* 1:1 viral card — wrapper constrains the scaled preview */}
        <div style={{ width: 540 * 0.56, height: 540 * 0.56, overflow: "hidden", borderRadius: 27 }}>
        <div
          ref={cardRef}
          style={{
            width: 540,
            height: 540,
            background: s.bg,
            transform: "scale(0.56)",
            transformOrigin: "top left",
            borderRadius: 48,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 36px", textAlign: "center" }}>
            {/* Emoji verdict */}
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>{s.emoji}</div>

            {/* Verdict label */}
            <div style={{
              display: "inline-block",
              padding: "8px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.15)",
              border: `2px solid ${s.accent}`,
              marginBottom: 20,
            }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: 2, textTransform: "uppercase" }}>
                {s.label}
              </span>
            </div>

            {/* Food name */}
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 32, lineHeight: 1.2, marginBottom: 8 }}>
              {result.food_name}
            </div>

            {/* For dog */}
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: 600, marginBottom: 24 }}>
              Analyse pour {dogName || "mon chien"}
            </div>

            {/* Score circle */}
            {result.score != null && (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: `3px solid ${s.accent}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{result.score}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>/10</span>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.5, maxWidth: 400, marginBottom: 20 }}>
                {result.summary.length > 120 ? result.summary.slice(0, 117) + "..." : result.summary}
              </div>
            )}

            {/* PawCoach branding */}
            <div style={{
              position: "absolute",
              bottom: 24,
              left: 0,
              right: 0,
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>🐾</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                  PawCoach
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={downloadCard} className="h-12 rounded-2xl gap-2 bg-white">
            <Download className="w-4 h-4" /> Enregistrer
          </Button>
          <Button onClick={shareCard} className="h-12 rounded-2xl gap-2 gradient-primary border-0 text-white">
            <Share2 className="w-4 h-4" /> Partager
          </Button>
        </div>
        <button onClick={onClose} className="flex items-center justify-center gap-1 w-full text-sm text-white/80">
          <X className="w-4 h-4" /> Fermer
        </button>
      </div>
    </div>
  );
}
