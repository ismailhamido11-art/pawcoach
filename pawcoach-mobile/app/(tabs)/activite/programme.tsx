import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import NutritionPaywall from '../../../components/nutrition/NutritionPaywall';
import { Colors } from '../../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type ExerciseType = 'walk' | 'run' | 'play' | 'training' | 'rest';

interface Exercise {
  day: number;
  title: string;
  description: string;
  duration_min: number;
  type: ExerciseType;
}

interface FitnessProgram {
  program_name: string;
  duration_days: number;
  exercises: Exercise[];
}

interface Bookmark {
  id: string;
  content: string | Record<string, unknown>;
}

// ─── Icon mapping by exercise type ───────────────────────────────────────────

const EXERCISE_ICONS: Record<ExerciseType, React.ComponentProps<typeof Ionicons>['name']> = {
  walk:     'walk',
  run:      'bicycle',
  play:     'football',
  training: 'fitness',
  rest:     'moon',
};

const EXERCISE_COLORS: Record<ExerciseType, string> = {
  walk:     Colors.forest[500],
  run:      Colors.sage[500],
  play:     Colors.earth[400],
  training: Colors.bark[400],
  rest:     Colors.muted,
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function ProgramSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 14 }}>
      <Skeleton h={20} w={180} />
      <Skeleton h={8} rounded={4} />
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton w={40} h={40} rounded={20} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton h={14} w="55%" />
              <Skeleton h={11} w="35%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Day row ─────────────────────────────────────────────────────────────────

function DayRow({
  exercise,
  completed,
  onToggle,
}: {
  exercise: Exercise;
  completed: boolean;
  onToggle: () => void;
}) {
  const type = (EXERCISE_ICONS[exercise.type] ? exercise.type : 'walk') as ExerciseType;
  const iconName = EXERCISE_ICONS[type];
  const iconColor = EXERCISE_COLORS[type];

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={`Jour ${exercise.day} — ${exercise.title}${completed ? ', complété' : ''}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        minHeight: 60,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: completed ? Colors.forest[50] : Colors.fieldBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={completed ? Colors.done : iconColor}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: completed ? Colors.done : Colors.forest[800],
            lineHeight: 19,
            textDecorationLine: completed ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          Jour {exercise.day} — {exercise.title}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>
          {exercise.duration_min} min
          {exercise.description ? ` · ${exercise.description}` : ''}
        </Text>
      </View>

      {/* Checkbox */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: completed ? 0 : 1.5,
          borderColor: Colors.earth[200],
          backgroundColor: completed ? Colors.forest[500] : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {completed && <Ionicons name="checkmark" size={14} color={Colors.cream} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProgrammeScreen() {
  const { user, profile } = useAuth();

  const [dog, setDog] = useState<{ id: string; name: string } | null>(null);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const loadProgram = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;
      const activeDog = dogData as { id: string; name: string } | null;
      setDog(activeDog);
      if (!activeDog) return;

      // Bookmark fitness_program le plus récent
      const { data: bmData } = await supabase
        .from('bookmarks')
        .select('id, content')
        .eq('dog_id', activeDog.id)
        .eq('source', 'fitness_program')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!bmData) {
        setBookmark(null);
        setProgram(null);
        return;
      }

      setBookmark(bmData as Bookmark);
      const raw = bmData.content;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setProgram(parsed as FitnessProgram);

      // Jours complétés
      const { data: progressData, error: progressErr } = await supabase
        .from('user_progress')
        .select('exercise_id')
        .eq('dog_id', activeDog.id)
        .eq('completed', true);
      if (progressErr) throw progressErr;
      const days = new Set<number>(
        (progressData ?? [])
          .map((r: { exercise_id: string }) => parseInt(r.exercise_id.replace('d', ''), 10))
          .filter((n: number) => !isNaN(n))
      );
      setCompletedDays(days);

    } catch (e) {
      setError('Impossible de charger le programme.');
      console.warn('[ProgrammeScreen] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProgram(); }, [loadProgram]);

  const toggleDay = useCallback(async (exercise: Exercise) => {
    if (!bookmark) return;
    const dayNum = exercise.day;
    const wasCompleted = completedDays.has(dayNum);

    // Optimistic update
    setCompletedDays((prev) => {
      const next = new Set(prev);
      wasCompleted ? next.delete(dayNum) : next.add(dayNum);
      return next;
    });

    try {
      const exerciseId = `d${dayNum}`;
      if (wasCompleted) {
        const { error: e } = await supabase
          .from('user_progress')
          .delete()
          .eq('dog_id', dog!.id)
          .eq('exercise_id', exerciseId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase
          .from('user_progress')
          .upsert(
            { dog_id: dog!.id, owner_id: user!.id, exercise_id: exerciseId, completed: true, completed_date: new Date().toISOString().split('T')[0] },
            { onConflict: 'dog_id,exercise_id' }
          );
        if (e) throw e;
      }
    } catch (e) {
      // Revert on error
      setCompletedDays((prev) => {
        const next = new Set(prev);
        wasCompleted ? next.add(dayNum) : next.delete(dayNum);
        return next;
      });
      console.warn('[ProgrammeScreen] toggleDay error:', e);
    }
  }, [bookmark, completedDays]);

  const generateNew = useCallback(async () => {
    if (!dog || regenerating) return;

    // Premium gate
    const isPremium = profile?.is_premium ?? false;
    const actionsRemaining = (profile as any)?.actions_remaining ?? 0;
    if (!isPremium && actionsRemaining <= 0) {
      setShowPaywall(true);
      return;
    }

    setRegenerating(true);
    setError(null);
    try {
      const invokePromise = supabase.functions.invoke('activity-program', { body: { dogId: dog.id } });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      const { data, error: fnErr } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnErr) {
        const status = (fnErr as any)?.context?.status;
        if (status === 429) { setShowPaywall(true); return; }
        throw fnErr;
      }
      if (!data?.success) throw new Error('Réponse invalide.');
      setLoading(true);
      await loadProgram();
    } catch (e: any) {
      const msg = (e as any)?.message ?? '';
      if (msg === 'timeout') {
        setError('La génération prend trop de temps. Réessayez.');
      } else {
        setError('Impossible de générer un nouveau programme. Réessayez.');
        console.warn('[ProgrammeScreen] generateNew error:', e);
      }
    } finally {
      setRegenerating(false);
    }
  }, [dog, regenerating, profile, loadProgram]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <ProgramSkeleton />
      </SafeAreaView>
    );
  }

  // ── No dog ────────────────────────────────────────────────────────────────
  if (!dog) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="paw-outline" size={56} color={Colors.forest[200]} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800], marginTop: 16, textAlign: 'center' }}>
          Aucun chien enregistré
        </Text>
      </SafeAreaView>
    );
  }

  // ── No program → empty state ──────────────────────────────────────────────
  if (!program && !regenerating) {
    return (
      <>
        <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}>
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: Colors.forest[50],
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="fitness" size={30} color={Colors.forest[400]} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.forest[800], textAlign: 'center' }}>
                Aucun programme actif
              </Text>
              <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 }}>
                Générez un programme d'activité IA personnalisé pour {dog.name} en un tap.
              </Text>
            </View>

            {error && (
              <View
                style={{ backgroundColor: Colors.errorBg, borderRadius: 10, borderWidth: 1, borderColor: Colors.errorBorder, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={generateNew}
              disabled={regenerating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Générer mon programme d'activité"
              style={{
                backgroundColor: Colors.forest[500],
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                minHeight: 52,
              }}
            >
              <Ionicons name="flash" size={18} color={Colors.cream} />
              <Text style={{ color: Colors.cream, fontSize: 16, fontWeight: '700' }}>
                Générer mon programme
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
        <NutritionPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          headline="Générations de programmes limitées — passez Premium"
        />
      </>
    );
  }

  // ── Regenerating ──────────────────────────────────────────────────────────
  if (regenerating) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={Colors.forest[500]} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.forest[700] }}>
            Génération du programme…
          </Text>
          <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
            L'IA prépare un programme personnalisé pour {dog.name}.
          </Text>
          <ProgramSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // ── Program loaded ────────────────────────────────────────────────────────
  const exercises = program!.exercises ?? [];
  const totalDays = program!.duration_days ?? exercises.length;
  const completedCount = completedDays.size;
  const progressPct = totalDays > 0 ? Math.min(100, (completedCount / totalDays) * 100) : 0;

  return (
    <>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progression header */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
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
            <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.forest[800], marginBottom: 4 }} numberOfLines={1}>
              {program!.program_name}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.muted, marginBottom: 14 }}>
              {completedCount}/{totalDays} jours complétés
            </Text>
            {/* Progress bar */}
            <View style={{ height: 8, backgroundColor: Colors.forest[50], borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: progressPct === 100 ? Colors.success : Colors.forest[500],
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {error && (
            <View
              style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.errorBg, borderRadius: 10, borderWidth: 1, borderColor: Colors.errorBorder, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle-outline" size={15} color={Colors.error} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>{error}</Text>
            </View>
          )}

          {/* Exercises list */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: Colors.white,
              borderRadius: 16,
              paddingHorizontal: 16,
              shadowColor: Colors.forest[500],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, paddingTop: 16, paddingBottom: 4 }}>
              PROGRAMME {totalDays} JOURS
            </Text>
            {exercises.map((ex, i) => (
              <View key={`day-${ex.day}-${i}`}>
                <DayRow
                  exercise={ex}
                  completed={completedDays.has(ex.day)}
                  onToggle={() => toggleDay(ex)}
                />
                {i < exercises.length - 1 && (
                  <View style={{ height: 1, backgroundColor: Colors.earth[100] }} />
                )}
              </View>
            ))}
          </View>

          {/* Regenerate */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <TouchableOpacity
              onPress={generateNew}
              disabled={regenerating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Générer un nouveau programme"
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                minHeight: 52,
                borderWidth: 1.5,
                borderColor: Colors.forest[200],
                backgroundColor: Colors.forest[50],
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={Colors.forest[500]} />
              <Text style={{ color: Colors.forest[500], fontSize: 15, fontWeight: '600' }}>
                Générer un nouveau programme
              </Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: Colors.fieldBg,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 11, color: Colors.muted, lineHeight: 16 }}>
              Ce programme est généré par IA à titre indicatif. Adaptez l'intensité à l'état de santé de votre chien et consultez un vétérinaire si nécessaire.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <NutritionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        headline="Générations de programmes limitées — passez Premium"
      />
    </>
  );
}
