import { Weight, Activity, Home, TrendingUp, TrendingDown, Minus } from "lucide-react";
import InlineEditCard from "./InlineEditCard.jsx";

const ACTIVITY_LABELS = {
  faible: "Faible", modere: "Modéré", eleve: "Élevé", tres_eleve: "Très élevé"
};
const ENV_LABELS = {
  appartement: "Appartement",
  maison_sans_jardin: "Maison s/ jardin",
  maison_avec_jardin: "Maison avec jardin",
};

export default function DogIdentityCards({ dog, dailyLogs, onSave }) {
  const weightLogs = (dailyLogs || []).filter(l => l.weight_kg).sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestLogWeight = weightLogs[0]?.weight_kg;
  const latestWeight = latestLogWeight || dog.weight;
  const prevWeight = weightLogs[1]?.weight_kg || (latestLogWeight && dog.weight && latestLogWeight !== dog.weight ? dog.weight : null);
  const trend = latestWeight && prevWeight ? latestWeight - prevWeight : 0;

  const trendColor = trend > 0 ? "text-emerald-500" : trend < 0 ? "text-blue-500" : "text-muted-foreground";

  const sexLabel = dog.sex === "male" ? "🐾 Mâle" : dog.sex === "female" ? "🐾 Femelle" : "—";

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Weight */}
      <InlineEditCard
        icon={Weight}
        iconColor="#2d9f82"
        label="Poids"
        value={latestWeight ? `${latestWeight} kg` : "—"}
        sub={trend !== 0 ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)} kg récemment` : undefined}
        subColor={trendColor}
        editField="weight"
        editType="number"
        editLabel="Poids (kg)"
        currentValue={dog.weight}
        onSave={onSave}
        min={0.1}
        max={200}
      />

      {/* Sex & neutered */}
      <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0 text-lg">
          {dog.sex === "male" ? "♂" : dog.sex === "female" ? "♀" : "?"}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Sexe</p>
          <p className="text-sm font-bold text-foreground truncate">
            {dog.sex === "male" ? "Mâle" : dog.sex === "female" ? "Femelle" : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">{dog.neutered ? "Stérilisé" : "Non stérilisé"}</p>
        </div>
      </div>

      {/* Activity */}
      <InlineEditCard
        icon={Activity}
        iconColor="#8b5cf6"
        label="Activité"
        value={ACTIVITY_LABELS[dog.activity_level] || "—"}
        editField="activity_level"
        editType="select"
        editLabel="Niveau d'activité"
        editOptions={[
          { value: "faible", label: "Faible" },
          { value: "modere", label: "Modéré" },
          { value: "eleve", label: "Élevé" },
          { value: "tres_eleve", label: "Très élevé" },
        ]}
        currentValue={dog.activity_level}
        onSave={onSave}
      />

      {/* Environment */}
      <InlineEditCard
        icon={Home}
        iconColor="#10b981"
        label="Environnement"
        value={ENV_LABELS[dog.environment] || "—"}
        editField="environment"
        editType="select"
        editLabel="Environnement"
        editOptions={[
          { value: "appartement", label: "Appartement" },
          { value: "maison_sans_jardin", label: "Maison s/ jardin" },
          { value: "maison_avec_jardin", label: "Maison avec jardin" },
        ]}
        currentValue={dog.environment}
        onSave={onSave}
      />
    </div>
  );
}