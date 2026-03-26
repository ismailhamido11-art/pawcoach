import { useState } from "react";
import { Sparkles, Target, Leaf, Users, ShieldAlert, Bone, Anchor, Zap, HeartHandshake, Compass, CloudRain } from "lucide-react";
import { motion } from "framer-motion";

const ALL_TAGS = [
  { value: "playful",     label: "Joueur",       Icon: Target,       color: "text-emerald-600" },
  { value: "calm",        label: "Calme",        Icon: Leaf,         color: "text-emerald-500" },
  { value: "social",      label: "Sociable",     Icon: Users,        color: "text-blue-600" },
  { value: "fearful",     label: "Craintif",     Icon: ShieldAlert,  color: "text-amber-500" },
  { value: "foodie",      label: "Gourmand",     Icon: Bone,         color: "text-amber-600" },
  { value: "stubborn",    label: "Têtu",         Icon: Anchor,       color: "text-slate-600" },
  { value: "energetic",   label: "Énergique",    Icon: Zap,          color: "text-amber-500" },
  { value: "cuddly",      label: "Câlin",        Icon: HeartHandshake, color: "text-rose-500" },
  { value: "independent", label: "Indépendant",  Icon: Compass,      color: "text-slate-600" },
  { value: "anxious",     label: "Anxieux",      Icon: CloudRain,    color: "text-blue-400" },
];

export default function DogPersonalitySection({ dog, onSave }) {
  const [saving, setSaving] = useState(false);

  const currentTags = (() => {
    try { return JSON.parse(dog.personality_tags || "[]"); } catch { return []; }
  })();

  const toggleTag = async (val) => {
    const next = currentTags.includes(val)
      ? currentTags.filter(t => t !== val)
      : [...currentTags, val];
    setSaving(true);
    await onSave({ personality_tags: JSON.stringify(next) });
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
        <p className="font-bold text-sm text-foreground">Personnalité</p>
        {saving && <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground mb-3">Appuie pour activer / désactiver</p>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map(tag => {
          const active = currentTags.includes(tag.value);
          const TagIcon = tag.Icon;
          return (
            <motion.button
              key={tag.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => toggleTag(tag.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-dashed border-border/60 opacity-60"
              }`}
            >
              <TagIcon className={`w-4 h-4 ${active ? "text-white" : tag.color}`} />
              <span>{tag.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
