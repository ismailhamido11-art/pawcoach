import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Share2, Mail, Copy, Check, Trash2, Loader2, UserCheck, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import DownloadHealthPDF from "./DownloadHealthPDF";

const SECTIONS = [
  { id: "vaccine", label: "Vaccins", emoji: "💉" },
  { id: "weight", label: "Poids", emoji: "⚖️" },
  { id: "vet_visit", label: "Visites véto", emoji: "🏥" },
  { id: "medication", label: "Médicaments", emoji: "💊" },
  { id: "note", label: "Notes", emoji: "📝" },
  { id: "checkins", label: "Check-ins quotidiens", emoji: "📊" },
  { id: "scans", label: "Scans alimentaires", emoji: "📷" },
  { id: "diagnosis", label: "Pré-diagnostics IA", emoji: "🩺" },
];

export default function ShareVetModal({ open, onOpenChange, dogId, dogName }) {
  const [vetEmail, setVetEmail] = useState("");
  const [vetName, setVetName] = useState("");
  const [selectedSections, setSelectedSections] = useState(["vaccine", "weight", "vet_visit", "medication", "note"]);
  const [loading, setLoading] = useState(false);
  const [accesses, setAccesses] = useState([]);
  const [loadingAccesses, setLoadingAccesses] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (open && dogId) loadAccesses();
  }, [open, dogId]);

  const loadAccesses = async () => {
    setLoadingAccesses(true);
    try {
      const res = await base44.functions.invoke("vetAccess", { action: "listByDog", dogId });
      setAccesses(res.data.accesses || []);
    } catch (e) {
      console.error("loadAccesses error:", e);
      toast.error("Erreur de chargement des accès");
    }
    setLoadingAccesses(false);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInvite = async () => {
    if (!vetEmail.trim()) return;
    if (!isValidEmail(vetEmail.trim())) {
      toast.error("Adresse email invalide");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("vetAccess", {
        action: "invite",
        dogId,
        vetEmail: vetEmail.trim().toLowerCase(),
        vetName: vetName.trim(),
        sections: selectedSections,
      });
      if (res.data.success) {
        toast.success(`Invitation envoyée à ${vetEmail}`);
        setVetEmail("");
        setVetName("");
        loadAccesses();
      } else {
        toast.error(res.data.error || "Erreur lors de l'envoi");
      }
    } catch (e) {
      console.error("handleInvite error:", e);
      toast.error("Erreur lors de l'envoi de l'invitation");
    }
    setLoading(false);
  };

  const handleRevoke = async (accessId) => {
    try {
      const res = await base44.functions.invoke("vetAccess", { action: "revoke", accessId });
      if (res.data.success) {
        toast.success("Accès révoqué");
        loadAccesses();
      }
    } catch (e) {
      console.error("handleRevoke error:", e);
      toast.error("Erreur lors de la révocation");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const statusBadge = (status) => {
    if (status === "active") return <Badge className="bg-green-100 text-green-700 text-[10px]"><UserCheck className="w-3 h-3 mr-1" />Actif</Badge>;
    if (status === "pending") return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Révoqué</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Partager le carnet de {dogName}
          </DialogTitle>
        </DialogHeader>

        {/* Existing accesses */}
        {accesses.filter(a => a.status !== "revoked").length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accès actifs</p>
            {accesses.filter(a => a.status !== "revoked").map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.vet_name || a.vet_email}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{a.vet_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusBadge(a.status)}
                    {a.status === "pending" && a.invite_code && (
                      <button onClick={() => copyCode(a.invite_code)} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                        {copiedCode === a.invite_code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {a.invite_code}
                      </button>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRevoke(a.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Invite form */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inviter un vétérinaire</p>

          <div>
            <Label className="text-xs">Email du vétérinaire *</Label>
            <div className="flex gap-2 mt-1">
              <Mail className="w-4 h-4 text-muted-foreground mt-2.5" />
              <Input
                type="email"
                value={vetEmail}
                onChange={e => setVetEmail(e.target.value)}
                placeholder="email@veterinaire.com"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Nom (optionnel)</Label>
            <Input
              value={vetName}
              onChange={e => setVetName(e.target.value)}
              placeholder="Dr. Martin"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Données à partager</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SECTIONS.map(s => (
                <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selectedSections.includes(s.id)}
                    onCheckedChange={() => toggleSection(s.id)}
                  />
                  <span className="text-xs">{s.emoji} {s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleInvite} disabled={loading || !vetEmail.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
            Envoyer l'invitation
          </Button>

          <div className="pt-3 border-t border-border mt-3">
            <p className="text-xs text-muted-foreground mb-2">Ou telecharge le carnet pour l'imprimer / l'envoyer toi-meme</p>
            <DownloadHealthPDF dogId={dogId} dogName={dogName} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}