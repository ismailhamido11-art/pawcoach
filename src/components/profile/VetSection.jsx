import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Stethoscope, Plus, CheckCircle, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  active:  { label: "Actif", icon: CheckCircle, color: "text-emerald-600" },
  pending: { label: "En attente", icon: Clock, color: "text-emerald-500" },
  revoked: { label: "Révoqué", icon: XCircle, color: "text-red-400" },
};

export default function VetSection({ dogs, activeDogId }) {
  const navigate = useNavigate();
  const [vetAccesses, setVetAccesses] = useState([]);

  useEffect(() => {
    if (!activeDogId) return;
    base44.entities.SharedVetAccess.filter({ dog_id: activeDogId })
      .then(data => setVetAccesses(data || []))
      .catch(() => {});
  }, [activeDogId]);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-sm text-foreground">Espace vétérinaire</span>
        </div>
        <button
          onClick={() => navigate(createPageUrl("Sante") + "?tab=vet")}
          className="flex items-center gap-1 text-xs text-primary font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Inviter
        </button>
      </div>

      <div className="px-4 py-3">
        {vetAccesses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Aucun vétérinaire invité</p>
            <button
              onClick={() => navigate(createPageUrl("Sante") + "?tab=vet")}
              className="mt-2 text-xs text-primary font-semibold underline"
            >
              Inviter un vétérinaire
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {vetAccesses.map(v => {
              const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={v.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{v.vet_name || v.vet_email}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.vet_email}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}