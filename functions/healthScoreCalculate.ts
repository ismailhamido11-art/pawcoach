import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dogId } = await req.json();
    if (!dogId) {
      return Response.json({ error: 'dogId required' }, { status: 400 });
    }

    // Fetch today's checkin
    const today = new Date().toISOString().split('T')[0];
    const checkins = await base44.entities.DailyCheckin.filter({ dog_id: dogId, date: today });
    const todayCheckin = checkins?.[0];

    // Fetch last 30 days of data
    const [recentCheckins, records, scans, dailyLogs] = await Promise.all([
      base44.entities.DailyCheckin.filter({ dog_id: dogId }, '-date', 30),
      base44.entities.HealthRecord.filter({ dog_id: dogId }, '-date', 100),
      base44.entities.FoodScan.filter({ dog_id: dogId }, '-timestamp', 30),
      base44.entities.DailyLog.filter({ dog_id: dogId }, '-date', 30),
    ]);

    // Calculate base score (0-100)
    let score = 50; // baseline

    // Checkin contribution (max +25)
    if (todayCheckin) {
      const avgMood = todayCheckin.mood || 2.5;
      const avgEnergy = todayCheckin.energy || 2;
      const avgAppetite = todayCheckin.appetite || 2;
      const checkinScore = ((avgMood / 4 + avgEnergy / 3 + avgAppetite / 3) / 3) * 25;
      score += checkinScore;
    }

    // Activity contribution (max +15)
    const avgWalkMinutes = dailyLogs?.length > 0
      ? dailyLogs.reduce((sum, log) => sum + (log.walk_minutes || 0), 0) / dailyLogs.length
      : 0;
    score += Math.min(avgWalkMinutes / 60 * 15, 15);

    // Toxicity/Food safety (max +15)
    const toxicScans = scans?.filter(s => s.verdict === 'toxic')?.length || 0;
    const cautionScans = scans?.filter(s => s.verdict === 'caution')?.length || 0;
    const scanPenalty = toxicScans * 5 + cautionScans * 2;
    score = Math.max(score - scanPenalty, 0);

    // Detect patterns (last 7 days)
    const last7Checkins = recentCheckins?.slice(0, 7) || [];
    let energyTrend = 'stable';
    let alert = null;

    if (last7Checkins.length >= 3) {
      const recentAvgEnergy = last7Checkins.slice(0, 3).reduce((sum, c) => sum + (c.energy || 0), 0) / 3;
      const olderAvgEnergy = last7Checkins.slice(3, 7).reduce((sum, c) => sum + (c.energy || 0), 0) / (last7Checkins.length > 3 ? Math.min(4, last7Checkins.length - 3) : 1);
      
      if (recentAvgEnergy < olderAvgEnergy - 0.5) {
        energyTrend = 'declining';
        alert = {
          type: 'energy_decline',
          message: `Énergie en baisse depuis 3 jours (${recentAvgEnergy.toFixed(1)}/3) → Visite vét recommandée`,
          severity: 'warning'
        };
      }
    }

    // Build insights
    const insights = [];
    if (todayCheckin) {
      if (todayCheckin.mood >= 3) insights.push('Humeur positive ✨');
      if (todayCheckin.energy >= 2.5) insights.push('Énergie bonne 🔥');
      if (todayCheckin.appetite === 2) insights.push('Appétit normal 🍗');
    }
    if (avgWalkMinutes > 40) insights.push('Activité excellente 🚶');
    if (insights.length === 0) insights.push('Continuer l\'observation 👀');

    // Cap score
    score = Math.min(Math.max(score, 0), 100);

    // Color based on score
    let color = '#10b981'; // green
    if (score < 40) color = '#ef4444'; // red
    else if (score < 60) color = '#f59e0b'; // amber
    else if (score < 80) color = '#3b82f6'; // blue

    return Response.json({
      score: Math.round(score),
      insights: insights.slice(0, 3),
      alert,
      energyTrend,
      color,
      dataPoints: {
        checkinCount: last7Checkins.length,
        avgWalkMinutes: Math.round(avgWalkMinutes),
        toxicScans,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});