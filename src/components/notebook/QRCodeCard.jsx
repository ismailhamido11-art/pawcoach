import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Download, Share2, X, Smartphone, Shield, Zap } from "lucide-react";

// Generates a QR code using the Google Charts API (no npm needed)
function buildQRUrl(text, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=0f4c3a&margin=10&format=png`;
}

export default function QRCodeCard({ dog }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!dog) return null;

  const profileUrl = `${window.location.origin}/DogPublicProfile?dogId=${dog.id}`;
  const qrSrc = buildQRUrl(profileUrl, 400);

  const handleDownload = async () => {
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `qr-urgence-${dog.name}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Dossier d'urgence de ${dog.name}`,
        text: `Accédez au dossier médical de ${dog.name} en cas d'urgence`,
        url: profileUrl,
      });
    } else {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* CTA Card */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-lg text-left"
      >
        <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">QR Code d'urgence</p>
          <p className="text-white/60 text-[11px]">Dossier médical accessible en 3 secondes</p>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-[10px] font-bold">Actif</span>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">QR Code d'urgence</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{dog.name} · Dossier médical complet</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Value props */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: Zap, label: "Instantané", sub: "Scan & accès direct", color: "#10b981" },
                  { icon: Shield, label: "Sécurisé", sub: "Lecture seule", color: "#2d9f82" },
                  { icon: Smartphone, label: "Universel", sub: "Tout smartphone", color: "#3b82f6" },
                ].map(({ icon: Icon, label, sub, color }) => (
                  <div key={label} className="flex flex-col items-center text-center bg-slate-50 rounded-xl py-3 px-2">
                    <Icon style={{ color, width: 18, height: 18 }} className="mb-1" />
                    <p className="text-[11px] font-bold text-slate-700">{label}</p>
                    <p className="text-[9px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="relative bg-white rounded-3xl shadow-xl border-4 border-slate-100 p-4 inline-block">
                  <img
                    src={qrSrc}
                    alt="QR Code urgence"
                    className="w-48 h-48 rounded-xl"
                    onError={e => { e.target.src = "data:image/svg+xml,..."; }}
                  />
                  {/* Dog photo overlay */}
                  {dog.photo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img src={dog.photo} alt={dog.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Instruction */}
              <p className="text-center text-xs text-slate-400 mb-5">
                Imprime ce code et colle-le sur le collier ou la laisse de <span className="font-bold text-slate-700">{dog.name}</span>
              </p>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white rounded-2xl py-3.5 font-bold text-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 bg-teal-600 text-white rounded-2xl py-3.5 font-bold text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? "Copié !" : "Partager"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}