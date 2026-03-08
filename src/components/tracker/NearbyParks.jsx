import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation, TreePine, Dog, Loader2, Shield, Droplets, Sun, Clock, ChevronDown } from "lucide-react";
import { fetchNearbyParks, findNearestPark } from "@/utils/overpass";
import ParkReviews from "./ParkReviews";

const TYPE_LABELS = {
  dog_park: { label: "Parc canin", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: Dog },
  park_dog_ok: { label: "Chiens acceptés", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: TreePine },
  park_leashed: { label: "En laisse", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: TreePine },
};

const SURFACE_LABELS = { grass: "Herbe", sand: "Sable", gravel: "Gravier", asphalt: "Asphalte", earth: "Terre" };

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function openDirections(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`, "_blank");
}

/** Compute paw rating (1-3) and attribute badges from OSM tags */
function computeParkInfo(park) {
  let paws = 1;
  const badges = [];

  if (park.type === "dog_park") paws = 2;
  if (park.tags.fenced === "yes") {
    badges.push({ icon: Shield, label: "Clôturé", color: "text-emerald-600" });
    if (park.type !== "park_leashed") paws = 3; // leashed parks capped at 2
  }
  if (park.tags.surface && SURFACE_LABELS[park.tags.surface]) {
    badges.push({ icon: TreePine, label: SURFACE_LABELS[park.tags.surface], color: "text-green-600" });
  }
  if (park.tags.lit === "yes") badges.push({ icon: Sun, label: "Éclairé", color: "text-yellow-600" });
  if (park.tags.drinking_water === "yes") badges.push({ icon: Droplets, label: "Point d'eau", color: "text-blue-500" });
  if (park.tags.opening_hours) badges.push({ icon: Clock, label: park.tags.opening_hours, color: "text-muted-foreground" });

  return { paws, badges };
}

/** Personalized advice based on dog profile */
function getDogAdvice(park, dog) {
  if (!dog) return null;
  const name = dog.name || "ton chien";
  const weight = dog.weight || 0;
  const age = dog.birth_date ? (Date.now() - new Date(dog.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 0;
  const isSmall = weight > 0 && weight < 10;
  const isLarge = weight >= 25;
  const isSenior = age >= 8;
  const isPuppy = age > 0 && age <= 1;

  // Safety first: leash requirement must never be masked
  if (park.type === "park_leashed") return `Chiens en laisse obligatoire — prévois la laisse pour ${name}.`;
  if (park.tags.fenced === "yes" && isSmall) return `Espace clos, idéal pour ${name} qui peut courir en sécurité.`;
  if (park.tags.fenced === "yes" && isPuppy) return `Parfait pour ${name} — espace clos pour explorer sans risque.`;
  if (park.tags.fenced !== "yes" && isSmall) return `Pas clôturé — garde ${name} en laisse pour sa sécurité.`;
  if (park.tags.fenced !== "yes" && isPuppy) return `Non clôturé — surveille bien ${name}, les chiots sont curieux !`;
  if (park.tags.surface === "grass" && isSenior) return `Surface douce, adaptée aux articulations de ${name}.`;
  if (park.type === "dog_park" && isLarge) return `Espace dédié — ${name} aura la place de se dépenser.`;
  if (park.type === "dog_park") return `Espace dédié aux chiens — ${name} pourra socialiser.`;
  return `Un bon spot pour une balade avec ${name}.`;
}

function PawRating({ paws }) {
  return (
    <span className="text-xs tracking-tight" title={`${paws}/3`}>
      {"🐾".repeat(paws)}{"○".repeat(3 - paws)}
    </span>
  );
}

export default function NearbyParks({ dog, user, onNearPark }) {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); setError("geo"); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const results = await fetchNearbyParks(latitude, longitude, 3000);
          setParks(results);
          const nearest = findNearestPark(latitude, longitude, results, 150);
          if (nearest && onNearPark) onNearPark(nearest);
        } catch (e) {
          console.warn("Overpass fetch failed:", e);
          setError("api");
        } finally {
          setLoading(false);
        }
      },
      () => { setLoading(false); setError("geo"); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  if (error === "geo") return null;
  if (!loading && parks.length === 0 && error !== "api") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 30 }}
      className="w-full space-y-2"
    >
      <div className="flex items-center gap-2">
        <TreePine className="w-4 h-4 text-emerald-600" />
        <p className="text-xs font-bold text-foreground">Parcs proches</p>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {error === "api" && (
        <p className="text-[10px] text-muted-foreground">Impossible de charger les parcs. Réessaie plus tard.</p>
      )}

      {!loading && parks.length > 0 && (
        <div className="space-y-2">
          {parks.slice(0, 5).map((park) => {
            const typeInfo = TYPE_LABELS[park.type] || TYPE_LABELS.park_dog_ok;
            const TypeIcon = typeInfo.icon;
            const { paws, badges } = computeParkInfo(park);
            const advice = getDogAdvice(park, dog);
            const isExpanded = expandedId === park.id;

            return (
              <motion.div
                key={park.id}
                layout
                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${isExpanded ? typeInfo.border : "border-border"}`}
              >
                {/* Compact row — always visible */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedId(isExpanded ? null : park.id)}
                  className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{park.name}</p>
                      <PawRating paws={paws} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                      {badges.slice(0, 2).map((b, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">• {b.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{formatDistance(park.distanceKm)}</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Expanded detail */}
                <motion.div layout className="overflow-hidden">
                  {isExpanded && (
                      <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/50 pt-3">
                        {/* Attribute badges */}
                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {badges.map((b, i) => (
                              <div key={i} className="flex items-center gap-1 bg-secondary/60 rounded-lg px-2 py-1">
                                <b.icon className={`w-3 h-3 ${b.color}`} />
                                <span className="text-[10px] font-semibold text-foreground">{b.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Description from OSM */}
                        {park.tags.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{park.tags.description}</p>
                        )}

                        {/* Personalized advice */}
                        {advice && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
                            <Dog className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">{advice}</p>
                          </div>
                        )}

                        {/* Reviews */}
                        <ParkReviews park={park} dog={dog} user={user} />

                        {/* Navigate button */}
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={(e) => { e.stopPropagation(); openDirections(park.lat, park.lng); }}
                          className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg, hsl(160,50%,22%), hsl(162,45%,38%))" }}
                        >
                          <Navigation className="w-4 h-4" />
                          Y aller ({formatDistance(park.distanceKm)})
                        </motion.button>
                      </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
