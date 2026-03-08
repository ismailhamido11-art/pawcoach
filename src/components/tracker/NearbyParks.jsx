import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, TreePine, Dog, Loader2 } from "lucide-react";
import { fetchNearbyParks, findNearestPark } from "@/utils/overpass";

const TYPE_LABELS = {
  dog_park: { label: "Parc canin", color: "text-emerald-600", bg: "bg-emerald-50", icon: Dog },
  park_dog_ok: { label: "Chiens acceptés", color: "text-blue-600", bg: "bg-blue-50", icon: TreePine },
  park_leashed: { label: "Chiens en laisse", color: "text-amber-600", bg: "bg-amber-50", icon: TreePine },
};

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function openDirections(lat, lng, name) {
  // Universal: works on iOS (Apple Maps) and Android (Google Maps)
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  window.open(url, "_blank");
}

export default function NearbyParks({ onNearPark }) {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      setError("geo");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        try {
          const results = await fetchNearbyParks(latitude, longitude, 3000);
          setParks(results);

          // Check if near a park
          const nearest = findNearestPark(latitude, longitude, results, 150);
          if (nearest && onNearPark) onNearPark(nearest);
        } catch (e) {
          console.warn("Overpass fetch failed:", e);
          setError("api");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("geo");
      },
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
        <div className="space-y-1.5">
          {parks.slice(0, 5).map((park) => {
            const typeInfo = TYPE_LABELS[park.type] || TYPE_LABELS.park_dog_ok;
            const TypeIcon = typeInfo.icon;
            return (
              <motion.div
                key={park.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => openDirections(park.lat, park.lng, park.name)}
                className="flex items-center gap-3 bg-white border border-border rounded-2xl px-3.5 py-2.5 cursor-pointer active:bg-secondary/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-4.5 h-4.5 ${typeInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{park.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                    {park.tags.fenced === "yes" && (
                      <span className="text-[10px] text-muted-foreground">• Clôturé</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{formatDistance(park.distanceKm)}</span>
                  <Navigation className="w-3.5 h-3.5 text-primary" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
