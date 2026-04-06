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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dog {
  id: string;
  name: string;
  breed: string | null;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface Programme {
  id: string;
  content: string | null;
  created_at: string;
}

interface ProgrammeContent {
  program_name?: string;
  duration_days?: number;
  exercises?: Array<{ day: number; title: string; description: string; duration_min: number; type: string }>;
}

interface WalkLog {
  id: string;
  logged_date: string;
  walk_minutes: number;
  walk_distance_km: number | null;
  walk_mood: string | null;
}

interface Badge {
  id: string;
  badge_name: string;
  badge_emoji: string;
  created_at: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function HubSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
      <Skeleton h={28} w={180} />
      <Skeleton h={16} w={220} />
      {/* Streak skeleton */}
      <Skeleton h={72} rounded={16} />
      {/* Programme skeleton */}
      <Skeleton h={96} rounded={16} />
      {/* Section label */}
      <Skeleton h={12} w={120} />
      {/* Walk rows */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton w={40} h={40} rounded={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton h={14} w="55%" />
            <Skeleton h={11} w="30%" />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Streak Widget ─────────────────────────────────────────────────────────────

function StreakWidget({ streak }: { streak: Streak }) {
  const isActive = streak.current_streak > 0;
  return (
    <View
      style={{
        backgroundColor: isActive ? Colors.forest[500] : Colors.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 72,
        shadowColor: Colors.forest[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isActive ? 0.18 : 0.08,
        shadowRadius: 10,
        elevation: isActive ? 4 : 2,
      }}
      accessibilityLabel={`Streak actuel : ${streak.current_streak} jour${streak.current_streak !== 1 ? 's' : ''}`}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isActive ? 'rgba(255,248,240,0.15)' : Colors.forest[50],
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="flame" size={22} color={isActive ? Colors.cream : Colors.forest[400]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: isActive ? Colors.cream : Colors.forest[800] }}>
          {streak.current_streak} jour{streak.current_streak !== 1 ? 's' : ''}
        </Text>
        <Text style={{ fontSize: 12, color: isActive ? 'rgba(255,248,240,0.75)' : Colors.muted, marginTop: 2 }}>
          Série actuelle · Record : {streak.longest_streak}j
        </Text>
      </View>
    </View>
  );
}

// ─── Programme Card ───────────────────────────────────────────────────────────

function ProgrammeCard({
  programme,
  completedDays,
  onPress,
}: {
  programme: Programme;
  completedDays: number;
  onPress: () => void;
}) {
  let parsed: ProgrammeContent = {};
  try {
    parsed = programme.content ? JSON.parse(programme.content) : {};
  } catch {
    // ignore
  }
  const name = parsed.program_name ?? 'Programme actif';
  const total = parsed.duration_days ?? 7;
  const progress = Math.min(completedDays, total);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${name} — ${progress} sur ${total} jours. Voir le programme`}
      style={{
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        minHeight: 88,
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
          <Ionicons name="barbell" size={22} color={Colors.forest[500]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.forest[800] }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>
            {progress}/{total} jours complétés
          </Text>
        </View>
        <View
          style={{
            backgroundColor: Colors.forest[50],
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            minHeight: 30,
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.forest[500] }}>Voir</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 6, backgroundColor: Colors.forest[50], borderRadius: 3, overflow: 'hidden' }}>
        <View
          style={{
            width: `${Math.round((progress / total) * 100)}%`,
            height: '100%',
            backgroundColor: Colors.forest[400],
            borderRadius: 3,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Generate CTA ─────────────────────────────────────────────────────────────

function GenerateCTA({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={loading ? 'Génération en cours' : 'Générer un programme'}
      accessibilityState={{ disabled: loading }}
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
        opacity: loading ? 0.7 : 1,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255,248,240,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.cream} />
          : <Ionicons name="barbell-outline" size={22} color={Colors.cream} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.cream }}>
          {loading ? 'Génération en cours…' : 'Générer un programme'}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,248,240,0.75)', marginTop: 2 }}>
          Programme IA personnalisé pour votre chien
        </Text>
      </View>
      {!loading && (
        <View
          style={{
            backgroundColor: 'rgba(255,248,240,0.15)',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            minHeight: 30,
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.cream }}>Générer</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Walk Row ─────────────────────────────────────────────────────────────────

const MOOD_EMOJI: Record<string, string> = {
  sad: '😔',
  neutral: '😐',
  happy: '😊',
  excited: '🤩',
};

function WalkRow({ log }: { log: WalkLog }) {
  const date = new Date(log.logged_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  const mood = log.walk_mood ? MOOD_EMOJI[log.walk_mood] ?? '' : '';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        minHeight: 52,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.forest[50],
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="walk" size={18} color={Colors.forest[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.forest[800] }}>
          {log.walk_minutes} min{log.walk_distance_km ? ` · ${log.walk_distance_km} km` : ''}{mood ? ` ${mood}` : ''}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>{date}</Text>
      </View>
    </View>
  );
}

// ─── Badge Preview ─────────────────────────────────────────────────────────────

function BadgePreview({ badge }: { badge: Badge }) {
  return (
    <View
      style={{
        alignItems: 'center',
        gap: 4,
        width: 72,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: Colors.forest[50],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 24 }}>{badge.badge_emoji}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.forest[700], textAlign: 'center' }} numberOfLines={2}>
        {badge.badge_name}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActiviteHub() {
  const router = useRouter();
  const { user } = useAuth();

  const [dog, setDog] = useState<Dog | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [completedDays, setCompletedDays] = useState(0);
  const [recentWalks, setRecentWalks] = useState<WalkLog[]>([]);
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // 1. Load dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id, name, breed')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;
      const activeDog = dogData as Dog | null;
      setDog(activeDog);
      if (!activeDog) return;

      // 2. Parallel fetches
      const [streakRes, programmeRes, walksRes, badgesRes] = await Promise.all([
        supabase
          .from('streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('dog_id', activeDog.id)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id, content, created_at')
          .eq('dog_id', activeDog.id)
          .eq('source', 'fitness_program')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('daily_logs')
          .select('id, logged_date, walk_minutes, walk_distance_km, walk_mood')
          .eq('dog_id', activeDog.id)
          .gt('walk_minutes', 0)
          .order('logged_date', { ascending: false })
          .limit(3),
        supabase
          .from('dog_achievements')
          .select('id, badge_name, badge_emoji, created_at')
          .eq('dog_id', activeDog.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      if (streakRes.error) throw streakRes.error;
      if (walksRes.error) throw walksRes.error;
      if (badgesRes.error) throw badgesRes.error;

      setStreak(streakRes.data as Streak ?? { current_streak: 0, longest_streak: 0, last_activity_date: null });
      setProgramme(programmeRes.data as Programme | null);
      setRecentWalks((walksRes.data as WalkLog[]) ?? []);
      setRecentBadges((badgesRes.data as Badge[]) ?? []);

      // Completed days (user_progress count)
      if (programmeRes.data) {
        const { count } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact', head: true })
          .eq('bookmark_id', programmeRes.data.id)
          .eq('completed', true);
        setCompletedDays(count ?? 0);
      }
    } catch (e) {
      setError('Impossible de charger les données d\'activité.');
      console.warn('[ActiviteHub] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleGenerate = useCallback(async () => {
    if (!dog || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('activity-program', {
        body: { dogId: dog.id },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error('Réponse invalide du serveur.');
      await loadData();
    } catch (e: any) {
      const msg = (e as any)?.message ?? '';
      if (msg.includes('quota') || msg.includes('429')) {
        setGenerateError('Quota atteint. Passez Premium pour générer des programmes illimités.');
      } else {
        setGenerateError('Impossible de générer le programme. Réessayez dans quelques instants.');
        console.warn('[ActiviteHub] generate error:', e);
      }
    } finally {
      setGenerating(false);
    }
  }, [dog, generating, loadData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
        <HubSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 12, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadData}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement"
          style={{
            marginTop: 16,
            backgroundColor: Colors.forest[500],
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: Colors.cream, fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Empty (no dog) ─────────────────────────────────────────────────────────
  if (!dog) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="paw-outline" size={56} color={Colors.forest[200]} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800], marginTop: 16, textAlign: 'center' }}>
          Aucun chien enregistré
        </Text>
        <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Ajoutez votre chien depuis l'accueil pour accéder au module Activité.
        </Text>
      </SafeAreaView>
    );
  }

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
          <Text
            style={{ fontSize: 24, fontWeight: '700', color: Colors.forest[800] }}
            accessibilityRole="header"
          >
            Activité
          </Text>
          <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 3 }}>
            Suivez l'activité de {dog.name}{dog.breed ? ` · ${dog.breed}` : ''}
          </Text>
        </View>

        {/* Streak */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {streak && <StreakWidget streak={streak} />}
        </View>

        {/* Programme */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 10 }}>
            PROGRAMME
          </Text>
          {programme ? (
            <ProgrammeCard
              programme={programme}
              completedDays={completedDays}
              onPress={() => router.push('/(tabs)/activite/programme' as any)}
            />
          ) : (
            <GenerateCTA onPress={handleGenerate} loading={generating} />
          )}
          {generateError && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: Colors.errorBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: Colors.errorBorder,
                padding: 12,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'flex-start',
              }}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle-outline" size={15} color={Colors.error} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>
                {generateError}
              </Text>
            </View>
          )}
        </View>

        {/* Dernières promenades */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>
              DERNIÈRES PROMENADES
            </Text>
          </View>

          {recentWalks.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 24,
                backgroundColor: Colors.white,
                borderRadius: 12,
                gap: 8,
              }}
            >
              <Ionicons name="walk-outline" size={28} color={Colors.forest[200]} />
              <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
                Aucune promenade enregistrée.{'\n'}Commencez dès aujourd'hui !
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
              {recentWalks.map((log, i) => (
                <View key={log.id}>
                  <WalkRow log={log} />
                  {i < recentWalks.length - 1 && (
                    <View style={{ height: 1, backgroundColor: Colors.earth[100] }} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Log walk button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/activite/log-walk' as any)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Loguer une promenade"
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: Colors.white,
              borderRadius: 14,
              paddingVertical: 14,
              minHeight: 52,
              borderWidth: 1.5,
              borderColor: Colors.forest[200],
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.forest[500]} />
            <Text style={{ color: Colors.forest[500], fontSize: 15, fontWeight: '600' }}>
              Loguer une promenade
            </Text>
          </TouchableOpacity>
        </View>

        {/* Badges récents */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>
              BADGES
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/activite/badges' as any)}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Voir tous les badges"
              style={{ paddingVertical: 4, paddingHorizontal: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.forest[500] }}>Voir tous →</Text>
            </TouchableOpacity>
          </View>

          {recentBadges.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 24,
                backgroundColor: Colors.white,
                borderRadius: 12,
                gap: 8,
              }}
            >
              <Ionicons name="ribbon-outline" size={28} color={Colors.forest[200]} />
              <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
                Aucun badge encore.{'\n'}Loguez votre première promenade !
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                gap: 8,
                flexWrap: 'wrap',
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {recentBadges.map((badge) => (
                <BadgePreview key={badge.id} badge={badge} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
