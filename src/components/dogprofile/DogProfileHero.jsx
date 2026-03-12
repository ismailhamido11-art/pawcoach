import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Illustration from "../illustrations/Illustration";
import { getDogAgeLabel } from "@/utils/healthStatus";

const STATUS_OPTIONS = [
  { value: "healthy", label: "En pleine forme", emoji: "💪", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "recovering", label: "En convalescence", emoji: "🩹", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "traveling", label: "En voyage", emoji: "✈️", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

export default function DogProfileHero({ dog, dailyLogs, onSave }) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === (dog.status || "healthy")) || STATUS_OPTIONS[0];

  const handleStatusChange = async (val) => {
    setShowStatusPicker(false);
    await onSave({ status: val });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onSave({ photo: file_url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Latest weight from DailyLog
  const latestLog = (dailyLogs || []).filter(l => l.weight_kg).sort((a, b) => b.date > a.date ? 1 : -1)[0];
  const displayWeight = latestLog?.weight_kg || dog.weight;

  return (
    <div className="relative gradient-primary safe-pt-24 pb-10 px-5">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        {/* Photo */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="w-28 h-28 rounded-full border-4 border-white/40 overflow-hidden shadow-2xl bg-white/20 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))" }}
          >
            {dog.photo ? (
              <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
            ) : (
              <Illustration name="petCare" alt={dog.name} className="w-full h-full object-cover" />
            )}
          </motion.div>
          </motion.div>
          <label aria-label="Changer la photo du chien" className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {uploadingPhoto ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-primary" />
            )}
          </label>
        </div>

        {/* Name & breed */}
        <div>
          <h1 className="text-white font-black text-2xl">{dog.name}</h1>
          <p className="text-white/70 text-sm mt-0.5">
            {dog.breed}{getDogAgeLabel(dog) ? ` · ${getDogAgeLabel(dog)}` : ""}
            {displayWeight ? ` · ${displayWeight} kg` : ""}
          </p>
        </div>

        {/* Status selector */}
        <div className="relative">
          <button
            aria-expanded={showStatusPicker}
            aria-haspopup="listbox"
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${currentStatus.color} bg-white`}
          >
            <span>{currentStatus.emoji}</span>
            <span>{currentStatus.label}</span>
          </button>

          {showStatusPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-50 min-w-[200px]"
            >
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-all text-sm font-medium ${s.value === (dog.status || "healthy") ? "bg-muted/20" : ""}`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                  {s.value === (dog.status || "healthy") && <Check className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}