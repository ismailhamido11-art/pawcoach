import { Button } from "@/components/ui/button";
import { Phone, Navigation, Globe, Star } from "lucide-react";

export default function VetSearchCard({ vet }) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{vet.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{vet.address}</p>
          {vet.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium">{vet.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {vet.phone && (
          <a href={`tel:${vet.phone}`} className="flex-1">
            <Button size="sm" className="w-full text-xs gap-1.5 gradient-primary text-white">
              <Phone className="w-3.5 h-3.5" />
              Appeler
            </Button>
          </a>
        )}
        {vet.google_maps_url && (
          <a href={vet.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              Itinéraire
            </Button>
          </a>
        )}
        {vet.website && (
          <a href={vet.website} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="text-xs">
              <Globe className="w-3.5 h-3.5" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}