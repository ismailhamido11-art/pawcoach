import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Dog {
  id: string;
  name: string;
  breed: string | null;
}

interface StreakData {
  current_streak: number;
  last_activity_date: string | null;
}

interface ActiveProgramme {
  id: string;
  program_name: string;
  duration_days: number;
  progress: number;
}

interface RecentWalk {
  id: string;
  walk_minutes: number;
  walk_distance: number | null;
  created_at: string;
}

interface RecentBadge {
  id: string;
  badge_id: string;
  name: string;
  emoji: string;
  unlocked_at: string;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function HubSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 16 }}>
      <Skeleton h={28} w={200} />
      <Skeleton h={16} w={240} />
      <View style={{ height: 8 }} />
      <Skeleton h={80} rounded={16} />
      <Skeleton h={100} rounded={16} />
      <Skeleton h={52} rounded={14} />
      <Skeleton h={80} rounded={16} />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ActiviteHub() {
  const router = useRouter();
  const { user } = useAuth();

  const [dog, setDog] = useState<Dog | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [programme, setProgramme] = useState<ActiveProgramme | null>(null);
  const [recentWalks, setRecentWalks] = useState<RecentWalk[]>([]);
  const [recentBadges, setRecentBadges] = useState<RecentBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingProgramme, setGeneratingProgramme] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // 1. Dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id, name, breed')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;
      const activeDog = dogData as Dog | null;
      setDog(activeDog);
      if (!activeDog) return;

      // 2. Streak
      const { data: streakData, error: streakErr } = await supabase
        .from('streaks')
        .select('current_streak, last_activity_date')
        .eq('dog_id', activeDog.id)
        .limit(1)
        .single();
      if (streakErr && streakErr.code !== 'PGRST116') throw streakErr;
      setStreak((streakData as StreakData | null) ?? null);

      // 3. Programme actif (bookmark le plus récent source='fitness_program')
      const { data: bookmarkData, error: bookmarkErr } = await supabase
        .from('bookmarks')
        .select('id, content')
        .eq('dog_id', activeDog.id)
        .eq('source', 'fitness_program')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (bookmarkErr && bookmarkErr.code !== 'PGRST116') throw bookmarkErr;

      if (bookmarkData) {
        const raw = bookmarkData.content;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const programName: string = parsed?.program_name ?? 'Programme activité';
        const durationDays: number = parsed?.duration_days ?? 7;
        const { count: progressCount, error: progressCountErr } = await supabase
          .from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('bookmark_id', bookmarkData.id)
          .eq('completed', true);
        if (progressCountErr) throw progressCountErr;
        setProgramme({
          id: bookmarkData.id,
          program_name: programName,
          duration_days: durationDays,
          progress: progressCount ?? 0,
        });
      } else {
        setProgramme(null);
      }

      // 4. Dernières promenades
      const { data: walksData } = await supabase
        .from('daily_logs')
        .select('id, walk_minutes, walk_distance, created_at')
        .eq('dog_id', activeDog.id)
        .gt('walk_minutes', 0)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentWalks((walksData as RecentWalk[]) ?? []);

      // 5. Badges récents
      const { data: badgesData } = await supabase
        .from('dog_achievements')
        .select('id, badge_id, name, emoji, unlocked_at')
        .eq('dog_id', activeDog.id)
        .order('unlocked_at', { ascending: false })
        .limit(3);
      setRecentBadges((badgesData as RecentBadge[]) ?? []);

    } catch (e) {
      setError("Impossible de charger les données d\u2019activité.");
      console.warn('[ActiviteHub] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleGenerateProgramme = useCallback(async () => {
    if (!dog || generatingProgramme) return;
    setGeneratingProgramme(true);
    try {
      const invokePromise = supabase.functions.invoke('activity-program', { body: { dogId: dog.id } });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      const { data, error: fnErr } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error('Réponse invalide.');
      await loadAll();
    } catch (e: any) {
      const msg = (e as any)?.message ?? '';
      if (msg === 'timeout') {
        setError('La génération prend trop de temps. Réessayez.');
      } else {
        setError('Impossible de générer le programme. Réessayez.');
        console.warn('[ActiviteHub] generateProgramme error:', e);
      }
    } finally {
      setGeneratingProgramme(false);
    }
  }, [dog, generatingProgramme, loadAll]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
        <HubSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error (no dog) ────────────────────────────────────────────────────────
  if (error && !dog) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 12, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadAll}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          style={{ marginTop: 16, backgroundColor: Colors.forest[500], paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ color: Colors.cream, fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Empty (no dog) ────────────────────────────────────────────────────────
  if (!dog) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="paw-outline" size={56} color={Colors.forest[200]} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800], marginTop: 16, textAlign: 'center' }}>
          Aucun chien enregistré
        </Text>
        <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Ajoutez votre chien depuis l'accueil pour suivre son activité.
        </Text>
      </SafeAreaView>
    );
  }

  const currentStreak = streak?.current_streak ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.forest[500]} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.forest[800] }} accessibilityRole="header">
            Activité
          </Text>
          <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 3 }}>
            {dog.name}{dog.breed ? ` · ${dog.breed}` : ''}
          </Text>
        </View>

        {/* Inline error */}
        {error && (
          <View
            style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.errorBg, borderRadius: 10, borderWidth: 1, borderColor: Colors.errorBorder, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}
            accessibilityRole="alert"
          >
            <Ionicons name="alert-circle-outline" size={15} color={Colors.error} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>{error}</Text>
          </View>
        )}

        {/* ── Streak ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 10 }}>
            STREAK
          </Text>
          <View
            style={{
              backgroundColor: currentStreak > 0 ? Colors.forest[500] : Colors.white,
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              shadowColor: Colors.forest[500],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: currentStreak > 0 ? 0.18 : 0.08,
              shadowRadius: 10,
              elevation: currentStreak > 0 ? 4 : 2,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: currentStreak > 0 ? 'rgba(255,248,240,0.15)' : Colors.forest[50],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26 }}>🔥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: currentStreak > 0 ? Colors.cream : Colors.forest[800],
                  lineHeight: 32,
                }}
              >
                {currentStreak} {currentStreak === 1 ? 'jour' : 'jours'}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: currentStreak > 0 ? 'rgba(255,248,240,0.75)' : Colors.muted,
                  marginTop: 2,
                }}
              >
                {currentStreak === 0
                  ? 'Loguez une promenade pour commencer'
                  : currentStreak >= 7
                  ? 'Série en feu — continuez !'
                  : 'Continuez à promener'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Programme ──────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 10 }}>
            PROGRAMME
          </Text>

          {generatingProgramme ? (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                gap: 12,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <ActivityIndicator size="small" color={Colors.forest[500]} />
              <Text style={{ fontSize: 14, color: Colors.muted }}>Génération du programme…</Text>
            </View>
          ) : programme ? (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/activite/programme' as any)}
              activeOpacity={0.78}
              accessibilityRole="button"
              style={{
                backgroundColor: Colors.white,
                borderRadius: 16,
                padding: 20,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.forest[50],
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Ionicons name="fitness" size={22} color={Colors.forest[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.forest[800] }} numberOfLines={1}>
                    {programme.program_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>
                    {programme.progress}/{programme.duration_days} jours complétés
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.forest[50],
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.forest[500] }}>Voir</Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={{ marginTop: 14 }}>
                <View style={{ height: 6, backgroundColor: Colors.forest[50], borderRadius: 3, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${Math.min(100, (programme.progress / programme.duration_days) * 100)}%`,
                      height: '100%',
                      backgroundColor: Colors.forest[500],
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            // CTA Générer
            <TouchableOpacity
              onPress={handleGenerateProgramme}
              disabled={generatingProgramme}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Générer un programme d'activité"
              style={{
                backgroundColor: Colors.forest[500],
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                minHeight: 88,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,248,240,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flash" size={24} color={Colors.cream} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.cream, lineHeight: 20 }}>
                  Générer un programme IA
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,248,240,0.75)', marginTop: 3 }}>
                  Programme 7 jours pour {dog.name}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,248,240,0.15)',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.cream }}>Générer</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Log promenade CTA ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/activite/log-walk' as any)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Loguer une promenade"
            style={{
              backgroundColor: Colors.white,
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              minHeight: 52,
              borderWidth: 1.5,
              borderColor: Colors.forest[200],
              shadowColor: Colors.forest[500],
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Ionicons name="walk" size={20} color={Colors.forest[500]} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.forest[500] }}>
              Loguer une promenade
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Dernières promenades ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 10 }}>
            DERNIÈRES PROMENADES
          </Text>
          {recentWalks.length === 0 ? (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                gap: 8,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Ionicons name="footsteps-outline" size={28} color={Colors.forest[200]} />
              <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
                Aucune promenade enregistrée.
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                paddingHorizontal: 14,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {recentWalks.map((walk, i) => {
                const date = new Date(walk.created_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                });
                const lbl = walk.walk_distance
                  ? `${walk.walk_minutes} min · ${walk.walk_distance} km`
                  : `${walk.walk_minutes} min`;
                return (
                  <View key={walk.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 52 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: Colors.forest[50],
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Ionicons name="walk" size={18} color={Colors.forest[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.forest[800] }}>{lbl}</Text>
                        <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>{date}</Text>
                      </View>
                    </View>
                    {i < recentWalks.length - 1 && (
                      <View style={{ height: 1, backgroundColor: Colors.earth[100] }} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Badges ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>BADGES</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/activite/badges' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Voir tous les badges"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.forest[400] }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {recentBadges.length === 0 ? (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                gap: 8,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Ionicons name="ribbon-outline" size={28} color={Colors.forest[200]} />
              <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
                Aucun badge débloqué encore.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {recentBadges.map((badge) => (
                <View
                  key={badge.id}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.white,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    gap: 6,
                    shadowColor: Colors.forest[500],
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{badge.emoji || '🏅'}</Text>
                  <Text
                    style={{ fontSize: 11, fontWeight: '600', color: Colors.forest[700], textAlign: 'center' }}
                    numberOfLines={2}
                  >
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
