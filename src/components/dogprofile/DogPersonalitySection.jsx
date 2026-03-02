import { useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const ALL_TAGS = [
  { value: "playful", label: "Joueur", emoji: "🎾" },
  { value: "calm", label: "Calme", emoji: "😌" },
  { value: "social", label: "Sociable", emoji: "🐾" },
  { value: "fearful", label: "Craintif", emoji: "😟" },
  { value: "foodie", label: "Gourmand", emoji: "🍖" },
  { value: "stubborn", label: "Têtu", emoji: "😤" },
  { value: "energetic", label: "Énergique", emoji: "⚡" },
  { value: "cuddly", label: "Câlin", emoji: "🤗" },
  { value: "independent", label: "Indépendant", emoji: "🦁" },
  { value: "anxious", label: "Anxieux", emoji: "😰" },
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
          return (
            <motion.button
              key={tag.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => toggleTag(tag.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}