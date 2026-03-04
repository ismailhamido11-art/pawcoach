import { useState } from "react";
import { base44 } from "@/api/base44Client";
import VetSearchCard from "../vet/VetSearchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Illustration from "../illustrations/Illustration";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FindVetContent({ dog }) {
  const [query, setQuery] = useState(dog?.vet_city || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche les cliniques vétérinaires proches de "${query}" en France. Retourne les 5 meilleures avec leurs informations. Pour chaque clinique : name, address, phone (format français), google_maps_url, website (ou null), rating (ou null).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            vets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, address: { type: "string" },
                  phone: { type: "string" }, google_maps_url: { type: "string" },
                  website: { type: "string" }, rating: { type: "number" },
                },
              },
            },
          },
        },
      });
      setResults(res.vets || []);
    } catch {
      toast.error("Erreur lors de la recherche. Réessaie.");
    }
    setLoading(false);
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div>
        <h2 className="font-bold text-foreground text-base">Trouver un vétérinaire</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Recherche une clinique vétérinaire près de chez toi</p>
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
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <p className="text-xs text-emerald-700 font-medium">Résultats générés par IA — vérifie les coordonnées avant de te déplacer.</p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20">
            <Illustration name="veterinary" alt="Recherche..." className="w-full h-full drop-shadow-md" />
          </motion.div>
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Recherche en cours…</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-10">
          <div className="w-24 h-24 mx-auto mb-3 opacity-60">
            <Illustration name="cautiousDog" alt="Aucun résultat" className="w-full h-full" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun résultat trouvé. Essaie une autre ville.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.map((vet, i) => <VetSearchCard key={i} vet={vet} />)}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="flex justify-center py-6">
          <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="w-28 h-28 opacity-60">
            <Illustration name="veterinary" alt="Vétérinaire" className="w-full h-full drop-shadow" />
          </motion.div>
        </div>
      )}

      {/* Portail vétérinaire */}
      <div className="mt-6 pt-4 border-t border-border">
        <Link to={createPageUrl("VetPortal")}>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Vous êtes vétérinaire ?</p>
                <p className="text-xs text-blue-500">Accéder à votre espace professionnel →</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}