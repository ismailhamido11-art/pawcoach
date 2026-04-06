import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type BadgeCategory = 'walk' | 'streak' | 'training';

interface BadgeDefinition {
  badge_id: string;
  name: string;
  emoji: string;
  category: BadgeCategory;
  condition: string;
}

interface UnlockedBadge {
  badge_id: string;
  unlocked_at: string;
}

// ─── All badges (locked + unlocked) ─────────────────────────────────────────

const ALL_BADGES: BadgeDefinition[] = [
  { badge_id: 'first_walk',     name: 'Première Balade',  emoji: '🐾', category: 'walk',     condition: '1 promenade' },
  { badge_id: 'walker_10',      name: 'Marcheur',          emoji: '🚶', category: 'walk',     condition: '10 promenades' },
  { badge_id: 'marathonien_50', name: 'Marathonien',       emoji: '🏃', category: 'walk',     condition: '50 promenades' },
  { badge_id: 'streak_7',       name: 'Semaine Parfaite',  emoji: '🔥', category: 'streak',   condition: '7 jours consécutifs' },
  { badge_id: 'streak_30',      name: 'Mois d\'Or',        emoji: '🥇', category: 'streak',   condition: '30 jours consécutifs' },
];

const CATEGORIES: { value: BadgeCategory | 'all'; label: string }[] = [
  { value: 'all',      label: 'Tous' },
  { value: 'walk',     label: 'Balades' },
  { value: 'streak',   label: 'Séries' },
  { value: 'training', label: 'Entraînement' },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function BadgeGridSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: '30%',
            backgroundColor: Colors.white,
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Skeleton w={44} h={44} rounded={22} />
          <Skeleton h={11} w="80%" />
          <Skeleton h={10} w="60%" />
        </View>
      ))}
    </View>
  );
}

// ─── Badge cell ──────────────────────────────────────────────────────────────

function BadgeCell({
  badge,
  unlocked,
  unlockedAt,
}: {
  badge: BadgeDefinition;
  unlocked: boolean;
  unlockedAt: string | null;
}) {
  const dateLabel = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        opacity: unlocked ? 1 : 0.4,
        shadowColor: Colors.forest[500],
        shadowOffset: { width: 0, height: unlocked ? 1 : 0 },
        shadowOpacity: unlocked ? 0.06 : 0,
        shadowRadius: 6,
        elevation: unlocked ? 1 : 0,
        minHeight: 100,
        justifyContent: 'center',
      }}
      accessibilityLabel={
        unlocked
          ? `${badge.name}, débloqué le ${dateLabel}`
          : `${badge.name}, verrouillé — ${badge.condition}`
      }
    >
      {/* Icon */}
      {unlocked ? (
        <Text style={{ fontSize: 32 }}>{badge.emoji}</Text>
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.fieldBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed" size={20} color={Colors.muted} />
        </View>
      )}

      {/* Name */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: unlocked ? Colors.forest[700] : Colors.muted,
          textAlign: 'center',
          lineHeight: 14,
        }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* Date or condition */}
      {unlocked && dateLabel ? (
        <Text style={{ fontSize: 10, color: Colors.muted, textAlign: 'center' }}>{dateLabel}</Text>
      ) : (
        <Text style={{ fontSize: 10, color: Colors.earth[300], textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>
          {badge.condition}
        </Text>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function BadgesScreen() {
  const { user } = useAuth();

  const [dogId, setDogId] = useState<string | null>(null);
  const [unlockedMap, setUnlockedMap] = useState<Map<string, string>>(new Map()); // badge_id → unlocked_at
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');

  const loadBadges = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;

      const dId = dogData?.id ?? null;
      setDogId(dId);
      if (!dId) return;

      const { data: achievements, error: achErr } = await supabase
        .from('dog_achievements')
        .select('badge_id, unlocked_at')
        .eq('dog_id', dId);
      if (achErr) throw achErr;

      const map = new Map<string, string>();
      (achievements as UnlockedBadge[] ?? []).forEach((a) => {
        map.set(a.badge_id, a.unlocked_at);
      });
      setUnlockedMap(map);

    } catch (e) {
      setError('Impossible de charger les badges.');
      console.warn('[BadgesScreen] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  }, [loadBadges]);

  // Filtered + sorted badges (unlocked first)
  const filteredBadges = ALL_BADGES
    .filter((b) => activeCategory === 'all' || b.category === activeCategory)
    .sort((a, b) => {
      const aUnlocked = unlockedMap.has(a.badge_id);
      const bUnlocked = unlockedMap.has(b.badge_id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return 0;
    });

  const unlockedCount = ALL_BADGES.filter((b) => unlockedMap.has(b.badge_id)).length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <BadgeGridSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 12, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadBadges}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
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

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
      <FlatList
        data={filteredBadges}
        keyExtractor={(item) => item.badge_id}
        numColumns={3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.forest[500]} />
        }
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 0 }}
        ListHeaderComponent={
          <>
            {/* Progress summary */}
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                backgroundColor: Colors.white,
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                shadowColor: Colors.forest[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
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
                <Ionicons name="ribbon" size={26} color={Colors.forest[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.forest[800], lineHeight: 26 }}>
                  {unlockedCount}/{ALL_BADGES.length}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 2 }}>
                  {unlockedCount === 0
                    ? 'Loguez votre première promenade !'
                    : unlockedCount === ALL_BADGES.length
                    ? 'Tous les badges débloqués — bravo !'
                    : `${ALL_BADGES.length - unlockedCount} badge${ALL_BADGES.length - unlockedCount > 1 ? 's' : ''} à débloquer`}
                </Text>
              </View>
            </View>

            {/* Category filter */}
            <View
              style={{
                paddingHorizontal: 16,
                marginTop: 16,
                marginBottom: 12,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setActiveCategory(cat.value)}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={cat.label}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? Colors.forest[500] : Colors.white,
                      borderWidth: 1.5,
                      borderColor: active ? Colors.forest[500] : Colors.earth[200],
                      minHeight: 44,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: active ? Colors.cream : Colors.forest[700],
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: Colors.white,
              borderRadius: 12,
              padding: 28,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="ribbon-outline" size={36} color={Colors.forest[200]} />
            <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 }}>
              Aucun badge dans cette catégorie.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, marginBottom: 12 }}>
            <BadgeCell
              badge={item}
              unlocked={unlockedMap.has(item.badge_id)}
              unlockedAt={unlockedMap.get(item.badge_id) ?? null}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
