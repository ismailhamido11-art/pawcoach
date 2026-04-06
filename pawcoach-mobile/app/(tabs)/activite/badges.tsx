import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── All badge definitions ────────────────────────────────────────────────────

interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  category: 'walk' | 'streak' | 'training';
  condition: string;
}

const ALL_BADGES: BadgeDef[] = [
  // Walk
  { id: 'premiere_balade',   name: 'Première Balade',   emoji: '🐾', category: 'walk',     condition: '1 promenade loguée' },
  { id: 'marcheur',          name: 'Marcheur',           emoji: '🚶', category: 'walk',     condition: '10 promenades loguées' },
  { id: 'marathonien',       name: 'Marathonien',        emoji: '🏃', category: 'walk',     condition: '50 promenades loguées' },
  // Streak
  { id: 'semaine_parfaite',  name: 'Semaine Parfaite',   emoji: '🌟', category: 'streak',   condition: '7 jours de suite' },
  { id: 'mois_or',           name: 'Mois d\'Or',          emoji: '🥇', category: 'streak',   condition: '30 jours de suite' },
  // Training
  { id: 'premier_programme', name: 'Premier Programme',  emoji: '💪', category: 'training', condition: '1 programme généré' },
  { id: 'athlete',           name: 'Athlète',             emoji: '🏆', category: 'training', condition: '3 programmes complétés' },
];

const CATEGORIES = [
  { key: 'all',      label: 'Tous' },
  { key: 'walk',     label: 'Marche' },
  { key: 'streak',   label: 'Série' },
  { key: 'training', label: 'Entraînement' },
] as const;

type Category = typeof CATEGORIES[number]['key'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnlockedBadge {
  badge_id: string;
  created_at: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function BadgesSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {/* Filter tabs skeleton */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} w={72} h={32} rounded={16} />)}
      </View>
      {/* Grid skeleton */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ width: '30%', alignItems: 'center', gap: 8 }}>
            <Skeleton w={72} h={72} rounded={36} />
            <Skeleton h={11} w={56} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Badge Cell ───────────────────────────────────────────────────────────────

function BadgeCell({
  def,
  unlockedAt,
}: {
  def: BadgeDef;
  unlockedAt: string | null;
}) {
  const unlocked = !!unlockedAt;
  const date = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        gap: 6,
      }}
      accessibilityLabel={`${def.name}${unlocked ? `, débloqué le ${date}` : `, verrouillé : ${def.condition}`}`}
    >
      {/* Badge circle */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: unlocked ? Colors.forest[50] : Colors.fieldBg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: unlocked ? 1 : 0.4,
          borderWidth: unlocked ? 2 : 1,
          borderColor: unlocked ? Colors.forest[200] : Colors.earth[200],
        }}
      >
        <Text style={{ fontSize: 30 }}>{def.emoji}</Text>
      </View>

      {/* Name */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: unlocked ? Colors.forest[700] : Colors.done,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {def.name}
      </Text>

      {/* Date or condition */}
      <Text
        style={{
          fontSize: 10,
          color: unlocked ? Colors.muted : Colors.earth[300],
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {unlocked ? date : def.condition}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BadgesScreen() {
  const { user } = useAuth();

  const [unlockedMap, setUnlockedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const loadBadges = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Load dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;
      if (!dogData) return;

      // Load achievements
      const { data: achievements, error: achErr } = await supabase
        .from('dog_achievements')
        .select('badge_id, created_at')
        .eq('dog_id', dogData.id);
      if (achErr) throw achErr;

      const map: Record<string, string> = {};
      for (const a of achievements ?? []) {
        map[(a as UnlockedBadge).badge_id] = (a as UnlockedBadge).created_at;
      }
      setUnlockedMap(map);
    } catch (e) {
      setError('Impossible de charger les badges.');
      console.warn('[BadgesScreen] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const filtered = activeCategory === 'all'
    ? ALL_BADGES
    : ALL_BADGES.filter((b) => b.category === activeCategory);

  // Build rows of 3 for FlatList
  const unlockedCount = Object.keys(unlockedMap).length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <BadgesSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
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
      {/* Progress header */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: Colors.forest[500],
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
        accessibilityLabel={`${unlockedCount} badges débloqués sur ${ALL_BADGES.length}`}
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
          <Ionicons name="ribbon" size={22} color={Colors.cream} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.cream }}>
            {unlockedCount} / {ALL_BADGES.length} badges
          </Text>
          <View style={{ height: 6, backgroundColor: 'rgba(255,248,240,0.2)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.round((unlockedCount / ALL_BADGES.length) * 100)}%`,
                height: '100%',
                backgroundColor: Colors.cream,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      {/* Category filter */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = activeCategory === item.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item.key)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? Colors.forest[500] : Colors.white,
                  borderWidth: active ? 0 : 1,
                  borderColor: Colors.earth[200],
                  minHeight: 36,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: active ? Colors.cream : Colors.muted,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Badges grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 32 }}
        columnWrapperStyle={{ gap: 4 }}
        ListEmptyComponent={
          <View
            style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}
          >
            <Ionicons name="ribbon-outline" size={40} color={Colors.forest[200]} />
            <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center' }}>
              Aucun badge dans cette catégorie.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <BadgeCell
              def={item}
              unlockedAt={unlockedMap[item.id] ?? null}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
