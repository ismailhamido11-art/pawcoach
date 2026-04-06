import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Dog {
  id: string;
  name: string;
  breed: string | null;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View
      style={{
        width: w ?? '100%',
        height: h,
        borderRadius: rounded,
        backgroundColor: Colors.skeleton,
      }}
    />
  );
}

function HubSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 16 }}>
      <Skeleton h={28} w={180} />
      <Skeleton h={16} w={220} />
      <View style={{ height: 12 }} />
      <Skeleton h={96} rounded={16} />
      <Skeleton h={96} rounded={16} />
    </View>
  );
}

// ─── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({
  icon,
  title,
  description,
  ctaLabel,
  onPress,
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${ctaLabel}`}
      style={{
        backgroundColor: accent ? Colors.forest[500] : Colors.white,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        minHeight: 88,
        shadowColor: Colors.forest[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: accent ? 0.18 : 0.08,
        shadowRadius: 10,
        elevation: accent ? 4 : 2,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: accent ? 'rgba(255,248,240,0.15)' : Colors.forest[50],
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={icon}
          size={24}
          color={accent ? Colors.cream : Colors.forest[500]}
        />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: accent ? Colors.cream : Colors.forest[800],
            lineHeight: 20,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: accent ? 'rgba(255,248,240,0.75)' : Colors.muted,
            marginTop: 3,
            lineHeight: 16,
          }}
        >
          {description}
        </Text>
      </View>

      {/* CTA */}
      <View
        style={{
          backgroundColor: accent ? 'rgba(255,248,240,0.15)' : Colors.forest[50],
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          minHeight: 30,
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: accent ? Colors.cream : Colors.forest[500],
          }}
        >
          {ctaLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NutritionHub() {
  const router = useRouter();
  const { user } = useAuth();

  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDog = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('dogs')
        .select('id, name, breed, weight, photo, birth_date, allergies, health_issues, activity_level')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      if (e && e.code !== 'PGRST116') throw e;
      setDog(data ?? null);
    } catch (e) {
      setError('Impossible de charger le profil de votre chien.');
      console.warn('[NutritionHub] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDog(); }, [loadDog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDog();
    setRefreshing(false);
  }, [loadDog]);

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
          onPress={loadDog}
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
          Ajoutez votre chien depuis l'accueil pour accéder à la nutrition.
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
            Nutrition
          </Text>
          <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 3 }}>
            Prenez soin de l'alimentation de {dog.name}
            {dog.breed ? ` · ${dog.breed}` : ''}
          </Text>
        </View>

        {/* Section label */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 10 }}>
          <Text
            style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}
          >
            MODULES
          </Text>
        </View>

        {/* Action cards */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActionCard
            icon="search"
            title="Scan Alimentaire"
            description="Vérifiez si un aliment est sans danger pour votre chien"
            ctaLabel="Scanner"
            onPress={() => router.push('/(tabs)/nutrition/scan' as any)}
          />
          <ActionCard
            icon="leaf"
            title="Plan Nutrition IA"
            description="Générez un plan repas 7 jours personnalisé pour votre chien"
            ctaLabel="Générer un plan"
            onPress={() => router.push('/(tabs)/nutrition/plan' as any)}
            accent
          />
        </View>

        {/* Info banner */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 24,
            backgroundColor: Colors.forest[50],
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color={Colors.forest[400]} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: Colors.muted, lineHeight: 18 }}>
            Les recommandations nutritionnelles sont générées par IA à titre indicatif. Consultez votre vétérinaire pour tout changement alimentaire important.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
