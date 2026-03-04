import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DogEditModal({ dog, onClose, onSave }) {
  const [form, setForm] = useState({
    name: dog.name || "",
    breed: dog.breed || "",
    birth_date: dog.birth_date || "",
    sex: dog.sex || "",
    neutered: dog.neutered || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const sanitizeName = (name) => name.replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim().slice(0, 50);

  const handleSave = async () => {
    if (form.birth_date && new Date(form.birth_date) > new Date()) return;
    setSaving(true);
    const cleanForm = { ...form, name: sanitizeName(form.name) };
    await onSave(cleanForm);
    setSaving(false);
    onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto pb-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-bold text-base text-foreground">Modifier le profil</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pt-5 space-y-4">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 bg-muted flex items-center justify-center">
                {dog.photo ? (
                  <img src={dog.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🐕</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow">
                {uploadingPhoto
                  ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />
                }
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          {[
            { label: "Nom", field: "name", type: "text" },
            { label: "Race", field: "breed", type: "text" },
            { label: "Date de naissance", field: "birth_date", type: "date" },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background outline-none focus:ring-1 focus:ring-primary"
                {...(type === "date" ? { max: new Date().toISOString().split("T")[0] } : {})}
              />
              {field === "birth_date" && form.birth_date && new Date(form.birth_date) > new Date() && (
                <p className="text-[11px] text-red-500 font-semibold mt-1">La date de naissance ne peut pas être dans le futur</p>
              )}
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sexe</label>
            <div className="flex gap-2">
              {[{ value: "male", label: "Mâle" }, { value: "female", label: "Femelle" }].map(o => (
                <button
                  key={o.value}
                  onClick={() => setForm(f => ({ ...f, sex: o.value }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${form.sex === o.value ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium text-foreground">Stérilisé(e)</p>
            <button
              onClick={() => setForm(f => ({ ...f, neutered: !f.neutered }))}
              className={`w-12 h-6 rounded-full transition-all ${form.neutered ? "bg-primary" : "bg-muted"} relative`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${form.neutered ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}