import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import VetSearchCard from "../components/vet/VetSearchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Stethoscope, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FindVet() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dog, setDog] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        setDog(dogs[0]);
        if (dogs[0].vet_city) setQuery(dogs[0].vet_city);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-8 pb-6 px-5 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Trouver un vétérinaire
          </h1>
          <p className="text-white/80 text-xs mt-0.5">
            Recherchez une clinique vétérinaire près de chez vous
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
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
        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
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