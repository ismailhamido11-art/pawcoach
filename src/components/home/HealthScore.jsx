import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Lock } from 'lucide-react';
import { isUserPremium } from '@/utils/premium';
import { computeHealthScore, getScoreLevel, computeStatusPills } from '@/utils/healthStatus';
import { motion } from 'framer-motion';

export default function HealthScore({ dog, user }) {
  const [score, setScore] = useState(null);
  const [level, setLevel] = useState(null);
  const [pills, setPills] = useState([]);
  const [loading, setLoading] = useState(true);
  const isPremium = isUserPremium(user);

  useEffect(() => {
    async function calculate() {
      if (!dog?.id) return;
      try {
        const [records, growthEntries, dailyLogs] = await Promise.all([
          base44.entities.HealthRecord.filter({ dog_id: dog.id }).catch(() => []),
          base44.entities.GrowthEntry.filter({ dog_id: dog.id }).catch(() => []),
          base44.entities.DailyLog.filter({ dog_id: dog.id }).catch(() => []),
        ]);

        // Normaliser GrowthEntry et DailyLog comme sources de poids supplementaires
        const extraWeightSources = [
          ...(growthEntries || []).filter(g => g.weight_kg && g.date),
          ...(dailyLogs || []).filter(l => l.weight_kg && l.date),
        ];

        const computed = computeHealthScore(records || [], dog, extraWeightSources);
        setScore(computed);
        setLevel(getScoreLevel(computed));
        setPills(computeStatusPills(records || [], dog));
      } catch (err) {
        console.error('Health score error:', err);
        setScore(50);
        setLevel(getScoreLevel(50));
      } finally {
        setLoading(false);
      }
    }
    calculate();
  }, [dog?.id]);

  if (loading) {
    return (
      <div className="mx-5 bg-white rounded-3xl p-6 border border-border/30 animate-pulse h-[200px]" />
    );
  }

  const scoreColor = level?.barColor || '#10b981';
  const scoreLabel = level?.label || 'Bon';
  const hasData = pills.some(p => p.status !== 'empty');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 bg-gradient-to-br from-white to-secondary/30 rounded-3xl p-6 border border-border/30 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">Sante du jour</h3>
        {!isPremium && <Lock className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Score circulaire */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle cx="60" cy="60" r="55" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {/* Score circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 345.58} 345.58`}
              strokeLinecap="round"
              className="origin-center -rotate-90"
              initial={{ strokeDasharray: '0 345.58' }}
              animate={{ strokeDasharray: `${(score / 100) * 345.58} 345.58` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              className="text-3xl font-black"
              style={{ color: scoreColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}
            </motion.p>
            <p className="text-xs text-muted-foreground font-medium">/100</p>
          </div>
        </div>

        {/* Insights */}
        <div className="flex-1 space-y-3">
          <p className="text-2xl font-bold" style={{ color: scoreColor }}>
            {scoreLabel}
          </p>
          <div className="space-y-1.5">
            {!hasData ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ajoute des donnees (pesees, vaccins, visites veto) pour affiner le score de {dog?.name || "ton chien"}.
              </p>
            ) : (
              pills.slice(0, 3).map((pill, i) => (
                <motion.p
                  key={pill.id}
                  className="text-sm text-foreground/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  • {pill.label} : {pill.value}
                </motion.p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Premium gate */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-primary/10 rounded-xl text-xs text-primary font-medium text-center"
        >
          Premium : Historique complet + Predictions detaillees
        </motion.div>
      )}
    </motion.div>
  );
}
