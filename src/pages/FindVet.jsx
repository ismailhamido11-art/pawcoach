import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import VetSearchCard from "../components/vet/VetSearchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Stethoscope, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Illustration from "../components/illustrations/Illustration";

export default function FindVet() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dog, setDog] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs.length > 0) {
          const activeDog = getActiveDog(dogs);
          setDog(activeDog);
          if (activeDog.vet_city) setQuery(activeDog.vet_city);
        }
      } catch (e) {
        console.error("FindVet init error:", e);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche les cliniques vétérinaires proches de "${query}" en France.
Retourne les 5 meilleures cliniques avec leurs informations.
Pour chaque clinique, fournis: name, address, phone (format français), google_maps_url (lien Google Maps basé sur le nom et l'adresse), website (si connu, sinon null), rating (note sur 5 si connue, sinon null).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            vets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  google_maps_url: { type: "string" },
                  website: { type: "string" },
                  rating: { type: "number" },
                },
              },
            },
          },
        },
      });

      setResults(res.vets || []);
    } catch (e) {
      console.error("handleSearch error:", e);
      toast.error("Erreur lors de la recherche. Reessaie.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-14 pb-6 px-5 relative overflow-hidden">
        <Link to={createPageUrl("Notebook")} className="relative z-20 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3 hover:bg-white/30 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <div className="relative z-10 flex items-end gap-3">
          <div className="flex-1 pb-1">
            <h1 className="text-white font-bold text-xl">Trouver un vétérinaire</h1>
            <p className="text-white/70 text-xs mt-0.5">
              Recherche une clinique pres de chez toi
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 flex-shrink-0"
          >
            <Illustration name="veterinary" alt="Vétérinaire" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ville ou code postal..."
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* AI disclaimer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <p className="text-xs text-emerald-700 font-medium">Ces resultats sont generes par IA et peuvent contenir des erreurs. Verifie les adresses et numeros avant de te deplacer ou d'appeler.</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 mb-2"
            >
              <Illustration name="veterinary" alt="Recherche..." className="w-full h-full drop-shadow-md" />
            </motion.div>
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-3 opacity-60">
              <Illustration name="cautiousDog" alt="Aucun résultat" className="w-full h-full" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun résultat trouvé. Essayez une autre ville.</p>
          </div>
        )}

        {!loading && results.map((vet, i) => (
          <VetSearchCard key={i} vet={vet} />
        ))}
      </div>

      <BottomNav currentPage="FindVet" />
    </div>
  );
}