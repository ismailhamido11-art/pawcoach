import { useState } from "react";
import { Bot, Check, Star, Target, BookOpen, Heart, Beef, Gamepad2, Brain } from "lucide-react";

const TONES = [
  { value: "encouraging", label: "Encourageant", Icon: Star, color: "text-amber-500" },
  { value: "direct", label: "Direct", Icon: Target, color: "text-emerald-600" },
  { value: "pedagogical", label: "Pédagogue", Icon: BookOpen, color: "text-blue-500" },
];

const TOPICS = [
  { value: "health", label: "Santé", Icon: Heart, color: "text-rose-500" },
  { value: "nutrition", label: "Nutrition", Icon: Beef, color: "text-orange-500" },
  { value: "training", label: "Dressage", Icon: Gamepad2, color: "text-emerald-600" },
  { value: "behavior", label: "Comportement", Icon: Brain, color: "text-violet-600" },
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
                {(() => { const TI = t.Icon; return <TI className={`w-4 h-4 ${currentTone === t.value ? "text-white" : t.color}`} />; })()}
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
                  {(() => { const TI2 = t.Icon; return <TI2 className={`w-3 h-3 ${active ? "text-white" : t.color}`} />; })()}
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