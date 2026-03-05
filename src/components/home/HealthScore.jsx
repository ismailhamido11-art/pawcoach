import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, TrendingDown, Lock } from 'lucide-react';
import { isUserPremium } from '@/utils/premium';
import { motion } from 'framer-motion';

export default function HealthScore({ dog, user, todayCheckin, records, scans, dailyLogs }) {
  const [score, setScore] = useState(null);
  const [insights, setInsights] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEstimate, setIsEstimate] = useState(false);
  const isPremium = isUserPremium(user);

  useEffect(() => {
    async function calculate() {
      if (!dog?.id) return;
      try {
        const response = await base44.functions.invoke('healthScoreCalculate', { dogId: dog.id });
        const data = response.data || {};
        setScore(data.score ?? 50);
        setInsights(data.insights || []);
        setAlert(data.alert || null);
        setIsEstimate(!data.insights || data.insights.length === 0);
      } catch (err) {
        console.error('Health score error:', err);
        setScore(50);
        setIsEstimate(true);
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

  const scoreColor = score < 40 ? '#ef4444' : score < 60 ? '#f59e0b' : score < 80 ? '#3b82f6' : '#10b981';
  const scoreLabel = score < 40 ? 'À surveiller' : score < 60 ? 'Correct' : score < 80 ? 'Bon' : 'Excellent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 bg-gradient-to-br from-white to-secondary/30 rounded-3xl p-6 border border-border/30 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">Santé du jour</h3>
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
            {isEstimate ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ajoute des données (check-ins, poids, vaccins) pour affiner le score de {dog?.name || "ton chien"}.
              </p>
            ) : (
              insights.map((insight, i) => (
                <motion.p
                  key={i}
                  className="text-sm text-foreground/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  • {insight}
                </motion.p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alert Section */}
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-border/30"
        >
          <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">{alert.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium gate */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-primary/10 rounded-xl text-xs text-primary font-medium text-center"
        >
          Premium : Historique complet + Prédictions détaillées
        </motion.div>
      )}
    </motion.div>
  );
}