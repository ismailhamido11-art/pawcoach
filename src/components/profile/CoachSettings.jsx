import { useState } from "react";
import { Bot, Check } from "lucide-react";

const TONES = [
  { value: "encouraging", label: "Encourageant", emoji: "🌟" },
  { value: "direct", label: "Direct", emoji: "🎯" },
  { value: "pedagogical", label: "Pédagogue", emoji: "📚" },
];

const TOPICS = [
  { value: "health", label: "Santé", emoji: "❤️" },
  { value: "nutrition", label: "Nutrition", emoji: "🥩" },
  { value: "training", label: "Dressage", emoji: "🎾" },
  { value: "behavior", label: "Comportement", emoji: "🧠" },
];

export default function CoachSettings({ user, onSave }) {
  const [saving, setSaving] = useState(null);

  const currentTone = user?.coach_tone || "encouraging";
  const currentTopics = (() => {
    try { return JSON.parse(user?.coach_topics || "[]"); } catch { return []; }
  })();

  const handleTone = async (val) => {
    setSaving("tone");
    await onSave({ coach_tone: val });
    setSaving(null);
  };

  const handleTopic = async (val) => {
    const next = currentTopics.includes(val)
      ? currentTopics.filter(t => t !== val)
      : [...currentTopics, val];
    setSaving("topics");
    await onSave({ coach_topics: JSON.stringify(next) });
    setSaving(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm text-foreground">Mon coach IA</span>
        {saving && <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-auto" />}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tone */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Ton du coach</p>
          <div className="flex gap-2">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTone(t.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  currentTone === t.value
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Sujets favoris</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => {
              const active = currentTopics.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => handleTopic(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}