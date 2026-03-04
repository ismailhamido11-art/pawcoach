import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "observation", label: "🔍 Observation" },
  { value: "recommendation", label: "💡 Recommandation" },
  { value: "prescription", label: "💊 Prescription" },
  { value: "follow_up", label: "📅 Suivi à prévoir" },
];

export default function VetNoteForm({ dogId, vetEmail, vetName, onNoteAdded }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("observation");
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    const note = await base44.entities.VetNote.create({
      dog_id: dogId,
      vet_email: vetEmail,
      vet_name: vetName,
      title: title.trim(),
      content: content.trim(),
      category,
      is_urgent: isUrgent,
    });

    toast.success("Note ajoutée");
    setTitle("");
    setContent("");
    setCategory("observation");
    setIsUrgent(false);
    setLoading(false);
    if (onNoteAdded) onNoteAdded(note);
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-border">
      <p className="text-sm font-semibold">Ajouter une note professionnelle</p>

      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre de la note..."
      />

      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Ton observation, recommandation ou prescription..."
        className="min-h-[100px]"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isUrgent} onCheckedChange={setIsUrgent} />
          <span className="text-xs text-red-600 font-medium">⚠️ Urgent</span>
        </label>
      </div>

      <Button onClick={handleSubmit} disabled={loading || !title.trim() || !content.trim()} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        Publier la note
      </Button>
    </div>
  );
}