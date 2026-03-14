import { useState } from "react";
import { Star, Phone, MapPin, Globe, Heart, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const TYPE_LABELS = {
  vet: { label: "Vétérinaire", color: "#ef4444", bg: "#ef444415" },
  groomer: { label: "Toiletteur", color: "#8b5cf6", bg: "#8b5cf615" },
  store: { label: "Animalerie", color: "#10b981", bg: "#10b98115" },
};

export default function PlaceCard({ place, isFavorite, favoriteId, favoriteNotes, onFavoriteToggle, dog, user }) {
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(favoriteNotes || "");
  const [tempNote, setTempNote] = useState("");

  const typeInfo = TYPE_LABELS[place.type] || TYPE_LABELS.vet;

  const handleToggleFavorite = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isFavorite && favoriteId) {
        await base44.entities.PlaceFavorite.delete(favoriteId);
        toast.success("Retiré des favoris");
        onFavoriteToggle(null);
      } else {
        const fav = await base44.entities.PlaceFavorite.create({
          owner: user.email,
          dog_id: dog?.id,
          place_name: place.name,
          place_type: place.type,
          address: place.address,
          phone: place.phone,
          google_maps_url: place.google_maps_url,
          website: place.website,
          rating: place.rating,
          notes: "",
          lat: place.lat,
          lng: place.lng,
        });
        toast.success("Ajouté aux favoris !");
        onFavoriteToggle(fav);
      }
    } catch {
      toast.error("Impossible de modifier les favoris. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!favoriteId) return;
    try {
      await base44.entities.PlaceFavorite.update(favoriteId, { notes: tempNote });
      setNote(tempNote);
      setEditingNote(false);
      toast.success("Note sauvegardée");
    } catch {
      toast.error("Impossible de sauvegarder la note. Réessaie.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: typeInfo.color, background: typeInfo.bg }}>
                {typeInfo.label}
              </span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  {place.rating}
                </span>
              )}
            </div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{place.name}</h3>
            {place.address && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />{place.address}
              </p>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={saving}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              isFavorite ? "bg-red-50 text-red-500" : "bg-muted/50 text-muted-foreground hover:text-red-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500" : ""}`} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {place.phone && (
            <a href={`tel:${place.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
              <Phone className="w-3.5 h-3.5" />{place.phone}
            </a>
          )}
          {place.google_maps_url && (
            <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />Itinéraire
            </a>
          )}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Notes section (favorites only) */}
        <AnimatePresence>
          {isFavorite && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/40"
            >
              {editingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={tempNote}
                    onChange={e => setTempNote(e.target.value)}
                    placeholder="Ajoute une note personnelle..."
                    className="w-full text-xs rounded-xl border border-border p-2.5 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveNote}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />Sauvegarder
                    </button>
                    <button onClick={() => setEditingNote(false)}
                      className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setTempNote(note); setEditingNote(true); }}
                  className="w-full flex items-start gap-2 text-left"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">
                    {note || "Ajouter une note personnelle..."}
                  </p>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}