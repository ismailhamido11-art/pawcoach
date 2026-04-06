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
import MealPlanDay, { type DayPlan } from '../../../components/nutrition/MealPlanDay';
import NutritionPaywall from '../../../components/nutrition/NutritionPaywall';
import { Colors } from '../../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  weight: number | null;
  birth_date: string | null;
  photo: string | null;
}

interface NutritionPlan {
  id: string;
  days: DayPlan[];
  tips: string[];
  total_daily_calories: number;
  recommended_range: { min: number; max: number };
  disclaimer: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

function PlanSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
      {/* Dog profile card skeleton */}
      <View
        style={{
          backgroundColor: Colors.white,
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Skeleton w={44} h={44} rounded={22} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton h={14} w="50%" />
          <Skeleton h={11} w="35%" />
        </View>
      </View>

      {/* Day selector skeleton */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} w={36} h={36} rounded={18} />
        ))}
      </View>

      {/* Section header + rows */}
      <View style={{ gap: 10 }}>
        <Skeleton h={12} w={60} />
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton w={36} h={36} rounded={18} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton h={14} w="55%" />
              <Skeleton h={11} w="30%" />
            </View>
            <Skeleton w={60} h={24} rounded={12} />
          </View>
        ))}
      </View>

      {/* Section header + rows (evening) */}
      <View style={{ gap: 10 }}>
        <Skeleton h={12} w={50} />
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton w={36} h={36} rounded={18} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton h={14} w="60%" />
              <Skeleton h={11} w="25%" />
            </View>
            <Skeleton w={60} h={24} rounded={12} />
          </View>
        ))}
      </View>

      {/* Total bar skeleton */}
      <Skeleton h={56} rounded={12} />

      {/* Tips skeleton */}
      <View style={{ backgroundColor: Colors.white, borderRadius: 14, padding: 16, gap: 10 }}>
        <Skeleton h={12} w={80} />
        <Skeleton h={14} />
        <Skeleton h={14} w="85%" />
      </View>
    </View>
  );
}

// ─── Dog age helper ───────────────────────────────────────────────────────────

function dogAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} mois`;
  return `${years} an${years > 1 ? 's' : ''}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const { user, profile } = useAuth();

  const [dog, setDog] = useState<Dog | null>(null);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // ── Load dog + existing plan ─────────────────────────────────────────────────
  const loadExistingPlan = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Load dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id, name, breed, weight, birth_date, photo')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      if (dogErr && dogErr.code !== 'PGRST116') throw dogErr;
      const activeDog = dogData as Dog | null;
      setDog(activeDog);

      if (!activeDog) return;

      // Check existing active plan
      const { data: existingPlan } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('dog_id', activeDog.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingPlan?.plan_json) {
        const parsed = typeof existingPlan.plan_json === 'string'
          ? JSON.parse(existingPlan.plan_json)
          : existingPlan.plan_json;
        setPlan(parsed as NutritionPlan);
      }
    } catch (e) {
      setError('Impossible de charger le plan nutritionnel.');
      console.warn('[PlanScreen] loadExistingPlan error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadExistingPlan(); }, [loadExistingPlan]);

  // ── Generate plan ────────────────────────────────────────────────────────────
  const generatePlan = useCallback(async () => {
    if (!dog || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const invokePromise = supabase.functions.invoke('nutrition-plan', {
        body: { dogId: dog.id },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      const { data, error: fnErr } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnErr) throw fnErr;
      if (!data?.success || !data?.plan) throw new Error('Réponse invalide du serveur.');
      setPlan(data.plan as NutritionPlan);
      setSelectedDayIndex(0);
    } catch (e: any) {
      const status = (e as any)?.context?.status;
      const msg = (e as any)?.message ?? '';
      if (status === 429 || msg.includes('quota') || msg.includes('nutrition_plan_quota')) {
        setShowPaywall(true);
      } else if (msg === 'timeout') {
        setError('La génération prend trop de temps. Vérifiez votre connexion et réessayez.');
      } else {
        setError('Impossible de générer le plan. Réessayez dans quelques instants.');
        console.warn('[PlanScreen] generatePlan error:', e);
      }
    } finally {
      setRegenerating(false);
    }
  }, [dog, regenerating]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <PlanSkeleton />
      </SafeAreaView>
    );
  }

  // ── No dog ────────────────────────────────────────────────────────────────────
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
        <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Ajoutez votre chien depuis l'accueil pour générer un plan nutrition.
        </Text>
      </SafeAreaView>
    );
  }

  // ── No plan yet → empty state with CTA ───────────────────────────────────────
  if (!plan && !regenerating) {
    return (
      <>
        <SafeAreaView
          edges={['bottom']}
          style={{ flex: 1, backgroundColor: Colors.cream }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}>
            {/* Dog card */}
            <DogCard dog={dog} />

            {/* Empty state */}
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 48,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: Colors.forest[50],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="leaf" size={30} color={Colors.forest[400]} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.forest[800], textAlign: 'center' }}>
                Aucun plan actif
              </Text>
              <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 }}>
                Générez un plan repas IA personnalisé pour {dog.name} en un tap.
              </Text>
            </View>

            {error && (
              <View
                style={{
                  backgroundColor: Colors.errorBg,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.errorBorder,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={generatePlan}
              disabled={regenerating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Générer mon plan nutrition"
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
                Générer mon plan nutrition
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
        <NutritionPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          headline="1 plan gratuit par semaine — passez Premium"
        />
      </>
    );
  }

  // ── Regenerating skeleton ────────────────────────────────────────────────────
  if (regenerating) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: 'center', gap: 16 }}>
          <DogCard dog={dog} />
          <ActivityIndicator size="large" color={Colors.forest[500]} style={{ marginTop: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.forest[700] }}>
            Génération du plan en cours…
          </Text>
          <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
            L'IA analyse le profil de {dog.name} et prépare son plan repas.
          </Text>
          <PlanSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // ── Plan loaded ───────────────────────────────────────────────────────────────
  const days = plan!.days ?? [];
  const currentDay = days[selectedDayIndex];

  return (
    <>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Dog profile card */}
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <DogCard dog={dog} />
          </View>

          {/* Day selector */}
          <View style={{ paddingTop: 20, paddingBottom: 4 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {days.map((day, i) => {
                const active = i === selectedDayIndex;
                // Short day name (3 chars)
                const short = day.day.substring(0, 3);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedDayIndex(i)}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={day.day}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: active ? Colors.forest[500] : Colors.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: active ? 0 : 1,
                      borderColor: Colors.earth[200],
                      shadowColor: Colors.forest[500],
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: active ? 0.2 : 0.04,
                      shadowRadius: 4,
                      elevation: active ? 3 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? Colors.cream : Colors.muted,
                      }}
                    >
                      {short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Selected day label */}
          {currentDay && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.forest[800], marginBottom: 12 }}>
                {currentDay.day}
              </Text>
            </View>
          )}

          {/* Meals for selected day */}
          {currentDay ? (
            <View style={{ paddingHorizontal: 16 }}>
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: Colors.forest[500],
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <MealPlanDay
                  plan={currentDay}
                  totalCalories={plan!.total_daily_calories}
                  recommendedMin={plan!.recommended_range.min}
                  recommendedMax={plan!.recommended_range.max}
                />
              </View>
            </View>
          ) : null}

          {/* AI Tips */}
          {plan!.tips && plan!.tips.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View
                style={{
                  backgroundColor: Colors.forest[50],
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: Colors.forest[100],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.forest[500]} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>
                    CONSEILS IA PERSONNALISÉS
                  </Text>
                </View>
                <View style={{ gap: 10 }}>
                  {plan!.tips.slice(0, 2).map((tip, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: Colors.forest[500],
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.cream }}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.forest[700], lineHeight: 19 }}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Regenerate button */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <TouchableOpacity
              onPress={generatePlan}
              disabled={regenerating}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Régénérer le plan"
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
                Régénérer le plan
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
              {plan!.disclaimer ?? 'Ce plan est généré par IA. Consultez votre vétérinaire avant tout changement alimentaire important.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Paywall modal */}
      <NutritionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        headline="1 plan gratuit par semaine — passez Premium"
      />
    </>
  );
}

// ─── Dog Card ─────────────────────────────────────────────────────────────────

function DogCard({ dog }: { dog: Dog }) {
  const age = dogAge(dog.birth_date);
  const meta = [dog.breed, dog.weight ? `${dog.weight} kg` : null, age]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: Colors.forest[500],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
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
        <Ionicons name="paw" size={22} color={Colors.forest[400]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.forest[800] }}>
          {dog.name}
        </Text>
        {meta ? (
          <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
