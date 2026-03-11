import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Send, Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const REVIEW_TAGS = [
  { id: "propre", label: "Propre" },
  { id: "ombrage", label: "Ombragé" },
  { id: "eau", label: "Eau dispo" },
  { id: "cloture", label: "Bien clôturé" },
  { id: "espace", label: "Grands espaces" },
  { id: "social", label: "Socialisation facile" },
  { id: "calme", label: "Calme" },
  { id: "entretenu", label: "Bien entretenu" },
];

function PawRatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <motion.button
          key={n}
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(n)}
          className="text-2xl leading-none"
          style={{ opacity: n <= value ? 1 : 0.25 }}
        >
          🐾
        </motion.button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const tags = review.tags ? review.tags.split(",").filter(Boolean) : [];
  return (
    <div className="bg-secondary/30 rounded-xl p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground">{review.dog_name}</span>
          {review.dog_breed && (
            <span className="text-[10px] text-muted-foreground">• {review.dog_breed}</span>
          )}
        </div>
        <span className="text-[10px]">{"🐾".repeat(review.rating)}</span>
      </div>
      {review.comment && (
        <p className="text-xs text-foreground/80 leading-relaxed">{review.comment}</p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map(t => (
            <span key={t} className="text-[10px] bg-primary/10 text-primary font-semibold rounded-md px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ParkReviews — displays reviews + form for a park.
 * Gracefully handles missing ParkReview entity (pre-Build prompt).
 */
export default function ParkReviews({ park, dog, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityExists, setEntityExists] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchReviews = useCallback(async () => {
    try {
      if (!base44.entities.ParkReview) { setEntityExists(false); setLoading(false); return; }
      const results = await base44.entities.ParkReview.filter({ park_osm_id: park.id }, "-created_date", 20);
      setReviews(results || []);
    } catch {
      setEntityExists(false);
    } finally {
      setLoading(false);
    }
  }, [park.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const toggleTag = (tagLabel) => {
    setSelectedTags(prev =>
      prev.includes(tagLabel) ? prev.filter(t => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Choisis une note"); return; }
    setSubmitting(true);
    try {
      await base44.entities.ParkReview.create({
        park_osm_id: park.id,
        park_name: park.name,
        park_lat: park.lat,
        park_lng: park.lng,
        owner: user?.email,
        dog_name: dog?.name || "Mon chien",
        dog_breed: dog?.breed || "",
        rating,
        comment: comment.trim(),
        tags: selectedTags.join(","),
      });
      toast.success("Avis publié !");
      setRating(0);
      setComment("");
      setSelectedTags([]);
      setShowForm(false);
      await fetchReviews();
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregate stats
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const allTags = reviews.flatMap(r => (r.tags || "").split(",").filter(Boolean));
  const tagCounts = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Check if current user already reviewed this park
  const userReviewed = reviews.some(r => r.owner === user?.email);

  // Entity doesn't exist yet — show placeholder
  if (!entityExists) {
    return (
      <div className="flex items-center gap-2 opacity-50">
        <MessageCircle className="w-3 h-3 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground italic">Avis bientôt disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Aggregate header */}
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Chargement des avis...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">{avgRating}</span>
            <span className="text-xs">{"🐾".repeat(Math.round(parseFloat(avgRating)))}</span>
            <span className="text-[10px] text-muted-foreground">({reviews.length} avis)</span>
          </div>
          {topTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topTags.map(([tag, count]) => (
                <span key={tag} className="text-[10px] bg-primary/10 text-primary font-semibold rounded-md px-1.5 py-0.5">
                  {tag} ({count})
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Recent reviews */}
      {reviews.slice(0, 3).map(r => (
        <ReviewCard key={r.id} review={r} />
      ))}

      {/* Add review button / form */}
      {!showForm && !userReviewed && user && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowForm(true)}
          className="w-full py-2 rounded-xl text-xs font-bold text-primary border border-primary/30 bg-primary/5 flex items-center justify-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5" />
          Donner mon avis
        </motion.button>
      )}

      {userReviewed && !showForm && (
        <p className="text-[10px] text-emerald-600 font-semibold text-center">Tu as déjà noté ce parc</p>
      )}

      {/* Review form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-primary/20 rounded-2xl p-3 space-y-3"
        >
          <p className="text-xs font-bold text-foreground">Ton avis sur {park.name}</p>

          {/* Paw rating */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Note</p>
            <PawRatingInput value={rating} onChange={setRating} />
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Ce qui décrit le parc</p>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TAGS.map(tag => {
                const active = selectedTags.includes(tag.label);
                return (
                  <motion.button
                    key={tag.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => toggleTag(tag.label)}
                    className={`text-[10px] font-semibold rounded-lg px-2.5 py-1 border transition-colors ${
                      active
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-secondary/40 border-border text-muted-foreground"
                    }`}
                  >
                    {tag.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Un mot ? (optionnel)</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={`Comment était l'expérience avec ${dog?.name || "ton chien"} ?`}
              rows={2}
              maxLength={200}
              className="w-full text-xs bg-secondary/30 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setRating(0); setComment(""); setSelectedTags([]); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-muted-foreground border border-border"
            >
              Annuler
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 gradient-primary"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publier
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Compact review prompt for post-walk screen.
 * Shows a mini form to rate a nearby park after a walk.
 */
export function PostWalkReviewPrompt({ park, dog, user, onDone }) {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);

  const submit = async () => {
    if (rating === 0 || !park || busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    try {
      if (!base44.entities.ParkReview) throw new Error("Entity not ready");
      await base44.entities.ParkReview.create({
        park_osm_id: park.id,
        park_name: park.name,
        park_lat: park.lat,
        park_lng: park.lng,
        owner: user?.email,
        dog_name: dog?.name || "Mon chien",
        dog_breed: dog?.breed || "",
        rating,
        comment: "",
        tags: "",
      });
      setDone(true);
      toast.success("Merci pour ton avis !");
      onDone?.();
    } catch (e) {
      if (base44.entities.ParkReview) {
        toast.error("Impossible d'envoyer l'avis");
      }
    } finally {
      setSubmitting(false);
      busyRef.current = false;
    }
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
        <p className="text-xs font-bold text-emerald-700">Merci pour ton avis sur {park.name} !</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 30 }}
      className="bg-white border border-border rounded-2xl p-3.5 space-y-2 w-full"
    >
      <p className="text-xs font-bold text-foreground">Tu étais au {park.name}</p>
      <p className="text-[10px] text-muted-foreground">Comment c'était pour {dog?.name || "ton chien"} ?</p>
      <div className="flex items-center justify-between">
        <PawRatingInput value={rating} onChange={setRating} />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={submit}
          disabled={submitting || rating === 0}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white disabled:opacity-40 gradient-primary"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Envoyer"}
        </motion.button>
      </div>
    </motion.div>
  );
}
