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
import HealthScore from '../../../components/health/HealthScore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthScoreData {
  total: number;
  vaccine_score: number;
  weight_score: number;
  activity_score: number;
  next_vaccine_title: string | null;
  next_vaccine_date: string | null;
}

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
        backgroundColor: '#E8EDEA',
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 16 }}>
      <Skeleton h={28} w={160} />
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 16 }}>
        <Skeleton h={140} w={140} rounded={70} />
        <Skeleton h={14} w={200} />
        <Skeleton h={12} w={160} />
        <Skeleton h={12} w={140} />
      </View>
      <Skeleton h={72} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Skeleton h={88} /></View>
        <View style={{ flex: 1 }}><Skeleton h={88} /></View>
        <View style={{ flex: 1 }}><Skeleton h={88} /></View>
      </View>
    </View>
  );
}

// ─── Pillar Bar ──────────────────────────────────────────────────────────────

function PillarBar({
  label,
  score,
  weight,
  icon,
}: {
  label: string;
  score: number;
  weight: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const color = score >= 70 ? '#2D5A3D' : score >= 40 ? '#C4A882' : '#C0392B';
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={icon} size={13} color={color} />
          <Text style={{ fontSize: 12, color: '#687068', fontWeight: '500' }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color }}>{score}</Text>
      </View>
      {/* Track */}
      <View style={{ height: 6, backgroundColor: '#EEF4F0', borderRadius: 3, overflow: 'hidden' }}>
        <View
          style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={{ fontSize: 10, color: '#C4A882', marginTop: 4 }}>Poids {weight}%</Text>
    </View>
  );
}

// ─── Nav Card ────────────────────────────────────────────────────────────────

function NavCard({
  icon,
  label,
  sublabel,
  onPress,
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${sublabel}`}
      style={{
        flex: 1,
        backgroundColor: accent ? '#2D5A3D' : '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        minHeight: 88,
        justifyContent: 'space-between',
        shadowColor: '#2D5A3D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: accent ? 0.2 : 0.08,
        shadowRadius: 8,
        elevation: accent ? 4 : 2,
      }}
    >
      <Ionicons name={icon} size={22} color={accent ? '#FFF8F0' : '#2D5A3D'} />
      <View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: accent ? '#FFF8F0' : '#132A1C', lineHeight: 18 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, color: accent ? 'rgba(255,248,240,0.75)' : '#687068', marginTop: 2 }}>
          {sublabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SanteDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDogs = useCallback(async () => {
    if (!user) return;
    const { data, error: e } = await supabase
      .from('dogs')
      .select('id, name, breed')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    if (e) throw e;
    const list = (data as Dog[]) ?? [];
    setDogs(list);
    return list[0] ?? null;
  }, [user]);

  const loadHealthScore = useCallback(async (dogId: string) => {
    const { data, error: e } = await supabase.rpc('compute_health_score', { p_dog_id: dogId });
    if (e) throw e;
    return data as HealthScoreData;
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const dog = await loadDogs();
      if (dog) {
        setSelectedDog(dog);
        const score = await loadHealthScore(dog.id);
        setHealthData(score);
      }
    } catch (e) {
      setError('Impossible de charger les données de santé.');
      console.warn('[SanteDashboard] error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, loadDogs, loadHealthScore]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#C0392B" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#132A1C', marginTop: 12, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadAll}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement"
          style={{
            marginTop: 16,
            backgroundColor: '#2D5A3D',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFF8F0', fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Empty (no dog) ─────────────────────────────────────────────────────────
  if (dogs.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="paw-outline" size={56} color="#ADD1B5" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#132A1C', marginTop: 16, textAlign: 'center' }}>
          Aucun chien enregistré
        </Text>
        <Text style={{ fontSize: 14, color: '#687068', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Ajoutez votre chien depuis l'accueil pour suivre sa santé.
        </Text>
      </SafeAreaView>
    );
  }

  const score = healthData?.total ?? 0;
  const vaccineScore = healthData?.vaccine_score ?? 0;
  const weightScore = healthData?.weight_score ?? 0;
  const activityScore = healthData?.activity_score ?? 0;

  const hasVaccineAlert = healthData?.next_vaccine_date !== null && healthData?.next_vaccine_date !== undefined;

  function formatDateFr(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D5A3D" />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text
            style={{ fontSize: 24, fontWeight: '700', color: '#132A1C' }}
            accessibilityRole="header"
          >
            Santé
          </Text>
          {selectedDog && (
            <Text style={{ fontSize: 14, color: '#687068', marginTop: 2 }}>
              {selectedDog.name}
              {selectedDog.breed ? ` · ${selectedDog.breed}` : ''}
            </Text>
          )}
        </View>

        {/* Health Score Card */}
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#2D5A3D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#687068', marginBottom: 16, letterSpacing: 0.5 }}>
              SCORE GLOBAL
            </Text>

            <HealthScore score={score} size={148} />

            {/* Pillar breakdown */}
            <View style={{ width: '100%', marginTop: 24, gap: 12 }}>
              <PillarBar label="Vaccins" score={vaccineScore} weight={40} icon="shield-checkmark" />
              <PillarBar label="Poids" score={weightScore} weight={30} icon="scale" />
              <PillarBar label="Activité" score={activityScore} weight={30} icon="footsteps" />
            </View>
          </View>
        </View>

        {/* Vaccine Alert */}
        {hasVaccineAlert && healthData?.next_vaccine_title && healthData?.next_vaccine_date && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/sante/vaccins')}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={`Rappel vaccin : ${healthData.next_vaccine_title} le ${formatDateFr(healthData.next_vaccine_date)}`}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: '#FFF8F0',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E4D0BB',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0E0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={18} color="#C4A882" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#132A1C' }}>
                Rappel vaccin
              </Text>
              <Text style={{ fontSize: 12, color: '#687068', marginTop: 2 }}>
                {healthData.next_vaccine_title} · {formatDateFr(healthData.next_vaccine_date)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4A882" />
          </TouchableOpacity>
        )}

        {/* Navigation Cards */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#687068', marginBottom: 10, letterSpacing: 0.5 }}>
            MODULES
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <NavCard
              icon="shield-checkmark"
              label="Vaccins"
              sublabel="Carnet & rappels"
              onPress={() => router.push('/(tabs)/sante/vaccins')}
            />
            <NavCard
              icon="scale"
              label="Poids"
              sublabel="Courbe & historique"
              onPress={() => router.push('/(tabs)/sante/poids')}
            />
            <NavCard
              icon="medkit"
              label="Diagnostic"
              sublabel="PawDoc IA"
              onPress={() => router.push('/(tabs)/sante/diagnostic')}
              accent
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
