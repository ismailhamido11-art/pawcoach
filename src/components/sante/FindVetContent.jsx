import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Stethoscope, Scissors, ShoppingBag, Heart, Navigation } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Illustration from "../illustrations/Illustration";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlaceCard from "./PlaceCard";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PLACE_TYPES = [
  { id: "vet",     label: "Vétérinaires", icon: Stethoscope, color: "#ef4444", searchTerm: "clinique vétérinaire" },
  { id: "groomer", label: "Toiletteurs",  icon: Scissors,    color: "#8b5cf6", searchTerm: "toiletteur chien" },
  { id: "store",   label: "Animaleries", icon: ShoppingBag,  color: "#10b981", searchTerm: "animalerie magasin animaux" },
];

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function createColoredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);transform:rotate(-45deg);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  });
}

export default function FindVetContent({ dog }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [query, setQuery] = useState(dog?.vet_city || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeType, setActiveType] = useState("vet");
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]); // France center
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const favs = await base44.entities.PlaceFavorite.filter({ owner: u.email });
        setFavorites(favs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFavs(false);
      }
    }
    loadUser();
  }, []);

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error("Géolocalisation non supportée"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        toast.success("Position détectée !");
      },
      () => toast.error("Impossible d'obtenir ta position")
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!isPremium && !hasCredits) {
      toast.error("Plus d'actions IA disponibles aujourd'hui");
      return;
    }
    setLoading(true);
    setSearched(true);
    setShowFavorites(false);
    const typeInfo = PLACE_TYPES.find(t => t.id === activeType);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche les "${typeInfo.searchTerm}" proches de "${query}" en France. Retourne les 6 meilleurs établissements. Pour chaque lieu : name, address, phone (format français), google_maps_url, website (ou null), rating (note /5 ou null), lat (latitude approximative), lng (longitude approximative).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            places: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, address: { type: "string" },
                  phone: { type: "string" }, google_maps_url: { type: "string" },
                  website: { type: "string" }, rating: { type: "number" },
                  lat: { type: "number" }, lng: { type: "number" },
                },
              },
            },
            city_lat: { type: "number" },
            city_lng: { type: "number" },
          },
        },
      });
      const places = (res.places || []).map(p => ({ ...p, type: activeType }));
      setResults(places);
      if (res.city_lat && res.city_lng) setMapCenter([res.city_lat, res.city_lng]);
      else if (places.length > 0 && places[0].lat && places[0].lng) setMapCenter([places[0].lat, places[0].lng]);
      if (!isPremium) await consume();
    } catch {
      toast.error("Erreur lors de la recherche. Réessaie.");
    }
    setLoading(false);
  };

  const getFavoriteForPlace = (place) =>
    favorites.find(f => f.place_name === place.name && f.place_type === place.type);

  const handleFavoriteToggle = (place, favRecord) => {
    if (favRecord === null) {
      setFavorites(prev => prev.filter(f => f.place_name !== place.name || f.place_type !== place.type));
    } else {
      setFavorites(prev => [...prev.filter(f => f.id !== favRecord.id), favRecord]);
    }
  };

  const displayedPlaces = showFavorites
    ? favorites.map(f => ({
        name: f.place_name, address: f.address, phone: f.phone,
        google_maps_url: f.google_maps_url, website: f.website, rating: f.rating,
        lat: f.lat, lng: f.lng, type: f.place_type,
      }))
    : results;

  return (
    <div className="pb-4">
      {/* Search Header */}
      <div className="px-4 pt-4 space-y-3">
        {/* Type selector */}
        <div className="flex gap-2">
          {PLACE_TYPES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveType(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-[10px] font-bold transition-all ${
                activeType === id ? "border-current shadow-sm" : "border-border bg-white text-muted-foreground"
              }`}
              style={activeType === id ? { color, borderColor: color, background: `${color}10` } : {}}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ville ou code postal..."
              className="pl-9"
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleGeolocate}
            className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Navigation className="w-4 h-4" />
          </button>
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Favorites toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {showFavorites ? `${favorites.length} favori(s)` : searched ? `${results.length} résultat(s)` : ""}
          </p>
          <button
            onClick={() => setShowFavorites(s => !s)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
              showFavorites ? "bg-red-50 text-red-500" : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-red-500" : ""}`} />
            Mes favoris ({favorites.length})
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-border/50 shadow-sm" style={{ height: 220 }}>
        <MapContainer center={mapCenter} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo center={mapCenter} />
          {displayedPlaces.filter(p => p.lat && p.lng).map((place, i) => {
            const typeInfo = PLACE_TYPES.find(t => t.id === place.type) || PLACE_TYPES[0];
            return (
              <Marker key={i} position={[place.lat, place.lng]} icon={createColoredIcon(typeInfo.color)}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{place.name}</p>
                    {place.address && <p className="text-gray-500 mt-0.5">{place.address}</p>}
                    {place.phone && <p className="mt-0.5">📞 {place.phone}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
        <p className="text-xs text-amber-700 font-medium">Résultats générés par IA — vérifie les coordonnées avant de te déplacer.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-20 h-20">
            <Illustration name="veterinary" className="w-full h-full drop-shadow-md" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Recherche en cours…</p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div className="px-4 mt-3 space-y-3">
          {displayedPlaces.length === 0 && (searched || showFavorites) ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-3 opacity-50">
                <Illustration name="cautiousDog" className="w-full h-full" />
              </div>
              <p className="text-sm text-muted-foreground">
                {showFavorites ? "Aucun favori pour l'instant." : "Aucun résultat. Essaie une autre ville."}
              </p>
            </div>
          ) : (
            displayedPlaces.map((place, i) => {
              const fav = getFavoriteForPlace(place);
              return (
                <PlaceCard
                  key={i}
                  place={place}
                  isFavorite={!!fav}
                  favoriteId={fav?.id}
                  favoriteNotes={fav?.notes}
                  onFavoriteToggle={(favRecord) => handleFavoriteToggle(place, favRecord)}
                  dog={dog}
                  user={user}
                />
              );
            })
          )}
        </div>
      )}

      {/* Empty initial state */}
      {!searched && !loading && !showFavorites && (
        <div className="flex justify-center py-6">
          <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 5, repeat: Infinity }} className="w-28 h-28 opacity-60">
            <Illustration name="veterinary" className="w-full h-full drop-shadow" />
          </motion.div>
        </div>
      )}

      {/* Portail vétérinaire */}
      <div className="mx-4 mt-4 pt-4 border-t border-border">
        <Link to={createPageUrl("VetPortal")}>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Tu es vétérinaire ?</p>
                <p className="text-xs text-blue-500">Accéder à ton espace professionnel →</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}