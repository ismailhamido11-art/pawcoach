import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealItem {
  name: string;
  portions: string;
  calories: number;
  type: 'morning' | 'evening';
}

export interface DayPlan {
  day: string;
  meals: MealItem[];
}

interface Props {
  plan: DayPlan;
  totalCalories: number;
  recommendedMin: number;
  recommendedMax: number;
}

// ─── Meal Row ─────────────────────────────────────────────────────────────────

function MealRow({ meal }: { meal: MealItem }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        minHeight: 48,
      }}
    >
      {/* Icon */}
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
        <Ionicons
          name={meal.type === 'morning' ? 'sunny' : 'moon'}
          size={16}
          color={Colors.forest[400]}
        />
      </View>

      {/* Name + portions */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.forest[800], lineHeight: 18 }}>
          {meal.name}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>
          {meal.portions}
        </Text>
      </View>

      {/* Calories badge */}
      <View
        style={{
          backgroundColor: Colors.forest[50],
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.forest[500] }}>
          {meal.calories} kcal
        </Text>
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function MealSection({
  title,
  icon,
  meals,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  meals: MealItem[];
}) {
  if (meals.length === 0) return null;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.earth[100],
          marginBottom: 4,
        }}
      >
        <Ionicons name={icon} size={14} color={Colors.earth[400]} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>
          {title}
        </Text>
      </View>

      {/* Meal rows */}
      {meals.map((meal, i) => (
        <View key={i}>
          <MealRow meal={meal} />
          {i < meals.length - 1 && (
            <View style={{ height: 1, backgroundColor: Colors.earth[100], marginLeft: 48 }} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealPlanDay({ plan, totalCalories, recommendedMin, recommendedMax }: Props) {
  const morningMeals = plan.meals.filter((m) => m.type === 'morning');
  const eveningMeals = plan.meals.filter((m) => m.type === 'evening');

  const totalPct = recommendedMax > 0 ? Math.min(100, (totalCalories / recommendedMax) * 100) : 0;
  const isInRange = totalCalories >= recommendedMin && totalCalories <= recommendedMax;
  const isLow = totalCalories < recommendedMin;
  const calColor = isInRange ? Colors.forest[500] : isLow ? Colors.earth[400] : Colors.error;

  return (
    <View>
      {/* Morning meals */}
      <MealSection title="MATIN" icon="sunny-outline" meals={morningMeals} />

      {/* Evening meals */}
      <MealSection title="SOIR" icon="moon-outline" meals={eveningMeals} />

      {/* Daily total bar */}
      <View
        style={{
          backgroundColor: Colors.forest[50],
          borderRadius: 12,
          padding: 14,
          marginTop: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flame-outline" size={14} color={calColor} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: calColor }}>
              Total journalier : {totalCalories} kcal
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: Colors.muted }}>
            Reco : {recommendedMin}–{recommendedMax}
          </Text>
        </View>

        {/* Progress bar */}
        <View
          style={{ height: 6, backgroundColor: Colors.earth[100], borderRadius: 3, overflow: 'hidden' }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: recommendedMax, now: totalCalories }}
        >
          <View
            style={{
              width: `${totalPct}%`,
              height: '100%',
              backgroundColor: calColor,
              borderRadius: 3,
            }}
          />
        </View>

        {!isInRange && (
          <Text style={{ fontSize: 11, color: Colors.muted, marginTop: 6 }}>
            {isLow
              ? 'En dessous de la recommandation — augmentez les portions si nécessaire.'
              : 'Au-dessus de la recommandation — réduisez légèrement les portions.'}
          </Text>
        )}
      </View>
    </View>
  );
}
