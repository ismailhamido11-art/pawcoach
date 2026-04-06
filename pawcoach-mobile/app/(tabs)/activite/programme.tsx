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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  day: number;
  title: string;
  description: string;
  duration_min: number;
  type: 'walk' | 'play' | 'training' | 'rest';
}

interface ProgrammeContent {
  program_name?: string;
  duration_days?: number;
  exercises?: Exercise[];
}

interface Programme {
  id: string;
  content: string | null;
  created_at: string;
  dog_id: string;
}

interface Dog {
  id: string;
  name: string;
  breed: string | null;
}

// ─── Exercise type config ──────────────────────────────────────────────────────

const EXERCISE_TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  walk:     { icon: 'walk',          label: 'Marche' },
  play:     { icon: 'game-controller', label: 'Jeu' },
  training: { icon: 'barbell',       label: 'Entraînement' },
  rest:     { icon: 'moon',          label: 'Repos' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function ProgrammeSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
      <Skeleton h={24} w={220} />
      <Skeleton h={14} w={160} />
      <Skeleton h={8} rounded={4} />
      <View style={{ gap: 12, marginTop: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Skeleton w={44} h={44} rounded={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton h={14} w="60%" />
              <Skeleton h={11} w="40%" />
            </View>
            <Skeleton w={28} h={28} rounded={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Day selector ─────────────────────────────────────────────────────────────

function DaySelector({
  totalDays,
  selectedDay,
  completedDays,
  onSelect,
}: {
  totalDays: number;
  selectedDay: number;
  completedDays: Set<number>;
  onSelect: (day: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const active = day === selectedDay;
        const done = completedDays.has(day);
        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(day)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Jour ${day}${done ? ', complété' : ''}`}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: active
                ? Colors.forest[500]
                : done
                ? Colors.forest[100]
                : Colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: active ? 0 : 1,
              borderColor: done ? Colors.forest[200] : Colors.earth[200],
              shadowColor: Colors.forest[500],
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: active ? 0.2 : 0.04,
              shadowRadius: 4,
              elevation: active ? 3 : 1,
            }}
          >
            {done && !active ? (
              <Ionicons name="checkmark" size={16} color={Colors.forest[500]} />
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? Colors.cream : Colors.muted,
                }}
              >
                J{day}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  completed,
  onToggle,
}: {
  exercise: Exercise;
  completed: boolean;
  onToggle: () => void;
}) {
  const cfg = EXERCISE_TYPE_CONFIG[exercise.type] ?? EXERCISE_TYPE_CONFIG.training;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
        minHeight: 60,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: completed ? Colors.forest[50] : Colors.forest[50],
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={cfg.icon}
          size={20}
          color={completed ? Colors.done : Colors.forest[500]}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: completed ? Colors.done : Colors.forest[800],
            textDecorationLine: completed ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          {exercise.title}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.muted }}>
          {cfg.label} · {exercise.duration_min} min
        </Text>
      </View>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Marquer comme non complété' : 'Marquer comme complété'}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: completed ? Colors.forest[400] : Colors.earth[200],
          backgroundColor: completed ? Colors.forest[400] : Colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          // Agrandir la zone de toucher avec hitSlop
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {completed && <Ionicons name="checkmark" size={16} color={Colors.cream} />}
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgrammeScreen() {
  const { user } = useAuth();

  const [dog, setDog] = useState<Dog | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [parsed, setParsed] = useState<ProgrammeContent>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [togglingDay, setTogglingDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Load dog
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

      // Load latest fitness_program
      const { data: progData, error: progErr } = await supabase
        .from('bookmarks')
        .select('id, content, created_at, dog_id')
        .eq('dog_id', activeDog.id)
        .eq('source', 'fitness_program')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (progErr) throw progErr;

      if (progData) {
        setProgramme(progData as Programme);
        try {
          const content = typeof progData.content === 'string'
            ? JSON.parse(progData.content)
            : progData.content ?? {};
          setParsed(content as ProgrammeContent);
        } catch {
          setParsed({});
        }

        // Load completed days from user_progress
        const { data: progressData, error: progressErr } = await supabase
          .from('user_progress')
          .select('exercise_id')
          .eq('bookmark_id', progData.id)
          .eq('completed', true);
        if (progressErr) throw progressErr;
        // exercise_id stores the day number as string
        const days = new Set((progressData ?? []).map((p: any) => Number(p.exercise_id)));
        setCompletedDays(days);
      }
    } catch (e) {
      setError('Impossible de charger le programme.');
      console.warn('[ProgrammeScreen] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleDay = useCallback(async (day: number) => {
    if (!programme || togglingDay !== null) return;
    setTogglingDay(day);
    const wasCompleted = completedDays.has(day);
    // Optimistic update
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(day);
      else next.add(day);
      return next;
    });
    try {
      if (wasCompleted) {
        const { error: delErr } = await supabase
          .from('user_progress')
          .delete()
          .eq('bookmark_id', programme.id)
          .eq('exercise_id', String(day));
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from('user_progress')
          .upsert({
            bookmark_id: programme.id,
            exercise_id: String(day),
            completed: true,
            completed_date: new Date().toISOString().split('T')[0],
          }, { onConflict: 'bookmark_id,exercise_id' });
        if (insErr) throw insErr;
      }
    } catch (e) {
      // Revert on error
      setCompletedDays((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(day);
        else next.delete(day);
        return next;
      });
      console.warn('[ProgrammeScreen] toggle error:', e);
    } finally {
      setTogglingDay(null);
    }
  }, [programme, togglingDay, completedDays]);

  const handleGenerate = useCallback(async () => {
    if (!dog || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('activity-program', {
        body: { dogId: dog.id },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error('Réponse invalide du serveur.');
      setCompletedDays(new Set());
      setSelectedDay(1);
      await loadData();
    } catch (e: any) {
      const msg = (e as any)?.message ?? '';
      if (msg.includes('quota') || (e as any)?.context?.status === 429) {
        setShowPaywall(true);
      } else {
        setError('Impossible de générer le programme. Réessayez dans quelques instants.');
        console.warn('[ProgrammeScreen] generate error:', e);
      }
    } finally {
      setRegenerating(false);
    }
  }, [dog, regenerating, loadData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <ProgrammeSkeleton />
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
          onPress={loadData}
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

  // ── No dog ─────────────────────────────────────────────────────────────────
  if (!dog) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="paw-outline" size={56} color={Colors.forest[200]} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800], marginTop: 16, textAlign: 'center' }}>
          Aucun chien enregistré
        </Text>
      </SafeAreaView>
    );
  }

  // ── No programme yet ────────────────────────────────────────────────────────
  if (!programme && !regenerating) {
    return (
      <>
        <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.forest[50],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="barbell-outline" size={34} color={Colors.forest[400]} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800], textAlign: 'center' }}>
              Aucun programme actif
            </Text>
            <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 32, paddingHorizontal: 16 }}>
              Générez un programme d'exercice IA personnalisé pour {dog.name} en un tap.
            </Text>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={regenerating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Générer mon programme"
              style={{
                backgroundColor: Colors.forest[500],
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 32,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                minHeight: 52,
                width: '100%',
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
          headline="Passez Premium pour des programmes illimités"
        />
      </>
    );
  }

  // ── Regenerating ────────────────────────────────────────────────────────────
  if (regenerating) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <ActivityIndicator size="large" color={Colors.forest[500]} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[700] }}>
          Génération en cours…
        </Text>
        <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
          L'IA prépare un programme personnalisé pour {dog.name}.
        </Text>
        <ProgrammeSkeleton />
      </SafeAreaView>
    );
  }

  // ── Programme loaded ────────────────────────────────────────────────────────
  const exercises = parsed.exercises ?? [];
  const totalDays = parsed.duration_days ?? 7;
  const programName = parsed.program_name ?? 'Programme d\'activité';
  const completedCount = completedDays.size;
  const progressPct = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  // Exercises for selected day
  const dayExercises = exercises.filter((e) => e.day === selectedDay);

  return (
    <>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header info */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800] }} numberOfLines={1}>
              {programName}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 4 }}>
              {completedCount}/{totalDays} jours complétés · {progressPct}%
            </Text>
          </View>

          {/* Progress bar */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{ height: 8, backgroundColor: Colors.forest[50], borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: Colors.forest[400],
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {/* Day selector */}
          <View style={{ paddingBottom: 16 }}>
            <DaySelector
              totalDays={totalDays}
              selectedDay={selectedDay}
              completedDays={completedDays}
              onSelect={setSelectedDay}
            />
          </View>

          {/* Day exercises */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.forest[700], marginBottom: 8 }}>
              Jour {selectedDay}
            </Text>

            {dayExercises.length === 0 ? (
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="moon-outline" size={28} color={Colors.forest[200]} />
                <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center' }}>
                  Repos prévu ce jour.
                </Text>
              </View>
            ) : (
              <View
                style={{
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
                {dayExercises.map((exercise, i) => (
                  <View key={`${exercise.day}-${i}`}>
                    <ExerciseRow
                      exercise={exercise}
                      completed={completedDays.has(exercise.day)}
                      onToggle={() => handleToggleDay(exercise.day)}
                    />
                    {i < dayExercises.length - 1 && (
                      <View style={{ height: 1, backgroundColor: Colors.earth[100] }} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Regenerate button */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <TouchableOpacity
              onPress={handleGenerate}
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
        </ScrollView>
      </SafeAreaView>

      <NutritionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        headline="Passez Premium pour des programmes illimités"
      />
    </>
  );
}
