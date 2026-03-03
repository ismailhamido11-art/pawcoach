import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share2 } from "lucide-react";

const VERDICT_STYLE = {
  safe:    { label: "✅ SANS DANGER",       bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
  caution: { label: "⚠️ AVEC PRÉCAUTION",   bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  toxic:   { label: "💀 TOXIQUE",           bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
};

export default function ShareCard({ result, dogName, onClose }) {
  const cardRef = useRef();
  const s = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.caution;

  const downloadCard = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const link = document.createElement("a");
    link.download = `pawcoach-scan-${result.food_name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareCard = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    canvas.toBlob(async (blob) => {
      if (navigator.share && navigator.canShare({ files: [new File([blob], "scan.png", { type: "image/png" })] })) {
        await navigator.share({ files: [new File([blob], "scan.png", { type: "image/png" })], title: "PawCoach Scan" });
      } else {
        downloadCard();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {/* Card to share */}
        <div
          ref={cardRef}
          style={{ background: s.bg, border: `2px solid ${s.border}` }}
          className="rounded-3xl p-6 text-center shadow-lg"
          >
          <div className="text-5xl mb-3">🐾</div>
          <p style={{ color: s.color }} className="text-2xl font-extrabold mb-1">{s.label}</p>
          <p className="text-gray-800 font-bold text-lg mb-1">{result.food_name}</p>
          <p className="text-gray-500 text-sm mb-4">Analyse pour {dogName}</p>
          {result.score != null && (
            <div className="inline-block px-4 py-1 rounded-full mb-4" style={{ background: s.border }}>
              <span style={{ color: s.color }} className="font-bold text-base">Score : {result.score}/10</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3 border-t border-gray-200 pt-3">
            🐾 Vérifié par <span className="font-bold text-gray-500">PawCoach</span>
          </p>
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