import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Heart } from "lucide-react";

export default function VetDogCard({ dog, access }) {
  const sharedSections = (() => {
    try { return JSON.parse(access.shared_sections || "[]"); } catch { return []; }
  })();

  return (
    <Link
      to={createPageUrl("VetDogView") + `?dogId=${dog.id}`}
      className="block p-4 rounded-2xl bg-white border border-border hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {dog.photo ? (
          <img src={dog.photo} alt={dog.name} className="w-14 h-14 rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">🐾</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{dog.name}</h3>
            <span className="text-xs text-muted-foreground">{dog.breed}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Propriétaire : {access.owner_email}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sharedSections.slice(0, 4).map(s => (
              <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
            ))}
            {sharedSections.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{sharedSections.length - 4}</Badge>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Link>
  );
}