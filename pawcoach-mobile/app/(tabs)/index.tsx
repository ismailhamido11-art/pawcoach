import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  sex: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function dogAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 24) return `${months} mois`;
  return `${Math.floor(months / 12)} ans`;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className: string }) {
  return <View className={`bg-earth-100 rounded-xl animate-pulse ${className}`} />;
}

function HomeSkeleton() {
  return (
    <View className="px-4 pt-4 gap-4">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-32 w-full" />
      <View className="flex-row gap-3">
        <SkeletonBlock className="flex-1 h-20" />
        <SkeletonBlock className="flex-1 h-20" />
        <SkeletonBlock className="flex-1 h-20" />
      </View>
      <SkeletonBlock className="h-14 w-full" />
      <SkeletonBlock className="h-14 w-full" />
    </View>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  color: string;
  accessibilityLabel: string;
}) {
  return (
    <View
      className="flex-1 bg-white rounded-xl p-3 items-center"
      style={{ shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 }}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text className="text-lg font-bold text-forest-800 mt-1">{value}</Text>
      <Text className="text-xs text-forest-500 mt-0.5">{label}</Text>
    </View>
  );
}

// ─── Quick Action ──────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onPress,
  primary,
  disabled,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-14 flex-1 rounded-xl items-center justify-center flex-row gap-2 ${
        primary ? 'bg-forest-500' : 'bg-white border border-earth-200'
      } ${disabled ? 'opacity-40' : ''}`}
      style={
        !primary
          ? { shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }
          : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      activeOpacity={0.82}
    >
      <Ionicons name={icon} size={20} color={primary ? '#FFF8F0' : '#2D5A3D'} />
      <Text className={`text-sm font-semibold ${primary ? 'text-cream' : 'text-forest-700'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi';

  const loadDogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date, sex')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const list = (data as Dog[]) ?? [];
      setDogs(list);
      if (list.length > 0 && !selectedDog) {
        setSelectedDog(list[0]);
      }
    } catch (e) {
      console.warn('[Home] loadDogs error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDogs(), refreshProfile()]);
    setRefreshing(false);
  }, [loadDogs, refreshProfile]);

  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-cream">
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  // ── Empty — pas de chien ─────────────────────────────────────────────────
  if (dogs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-cream">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-forest-100 items-center justify-center mb-6">
            <Ionicons name="paw-outline" size={40} color="#2D5A3D" />
          </View>
          <Text className="text-2xl font-bold text-forest-800 mb-3 text-center" accessibilityRole="header">
            Ajoutez votre chien
          </Text>
          <Text className="text-base text-forest-600 text-center leading-6 mb-8">
            Commencez par créer le profil de votre compagnon pour accéder à toutes les fonctionnalités.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/add-dog')}
            className="h-14 w-full bg-forest-500 rounded-xl items-center justify-center flex-row gap-2"
            accessibilityRole="button"
            accessibilityLabel="Ajouter mon chien"
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#FFF8F0" />
            <Text className="text-base font-semibold text-cream">Ajouter mon chien</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D5A3D"
            colors={['#2D5A3D']}
          />
        }
      >
        {/* Header — Bonjour + dog selector */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-sm text-forest-500 font-medium">Bonjour,</Text>
            <Text
              className="text-2xl font-bold text-forest-800"
              accessibilityRole="header"
            >
              {firstName} 👋
            </Text>
          </View>

          {/* Dog selector (affiché si >1 chien) */}
          {dogs.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {dogs.map((dog) => (
                  <TouchableOpacity
                    key={dog.id}
                    onPress={() => setSelectedDog(dog)}
                    className={`h-9 px-3 rounded-full border items-center justify-center ${
                      selectedDog?.id === dog.id
                        ? 'bg-forest-500 border-forest-500'
                        : 'bg-white border-earth-200'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Sélectionner ${dog.name}`}
                    accessibilityState={{ selected: selectedDog?.id === dog.id }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedDog?.id === dog.id ? 'text-cream' : 'text-forest-700'
                      }`}
                    >
                      {dog.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>

        {/* Dog Card */}
        {selectedDog ? (
          <View
            className="bg-white rounded-xl p-4 mb-4"
            style={{ shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
            accessibilityLabel={`Chien : ${selectedDog.name}`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-forest-100 items-center justify-center">
                <Ionicons name="paw" size={24} color="#2D5A3D" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-forest-800">{selectedDog.name}</Text>
                <Text className="text-sm text-forest-500">
                  {[selectedDog.breed, dogAge(selectedDog.birth_date)]
                    .filter(Boolean)
                    .join(' · ') || 'Profil incomplet'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/onboarding/add-dog')}
                className="w-11 h-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Ajouter un autre chien"
              >
                <Ionicons name="add-circle-outline" size={24} color="#4E9A6B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <StatCard
            icon="flame"
            label="Série"
            value={profile?.streak ?? 0}
            color="#C4A882"
            accessibilityLabel={`Série de ${profile?.streak ?? 0} jours`}
          />
          <StatCard
            icon="chatbubble-outline"
            label="Crédits"
            value={profile?.credits ?? 0}
            color="#2D5A3D"
            accessibilityLabel={`${profile?.credits ?? 0} crédits messages`}
          />
          <StatCard
            icon="star-outline"
            label="Points"
            value={profile?.points ?? 0}
            color="#4E9A6B"
            accessibilityLabel={`${profile?.points ?? 0} points`}
          />
        </View>

        {/* Quick Actions */}
        <Text className="text-sm font-semibold text-forest-600 mb-3 uppercase tracking-wide">
          Actions rapides
        </Text>
        <View className="gap-3">
          {/* Chat IA — CTA primaire dominant */}
          <QuickAction
            icon="chatbubbles-outline"
            label="Chat IA"
            onPress={() => router.push('/chat')}
            primary
            disabled={(profile?.credits ?? 0) === 0}
            accessibilityLabel={
              (profile?.credits ?? 0) === 0
                ? 'Chat IA — crédits épuisés'
                : 'Ouvrir le Chat IA'
            }
          />
          <View className="flex-row gap-3">
            <QuickAction
              icon="checkmark-circle-outline"
              label="Check-in"
              onPress={() => {}}
              disabled
              accessibilityLabel="Check-in — bientôt disponible"
            />
            <QuickAction
              icon="scan-outline"
              label="Scanner"
              onPress={() => {}}
              disabled
              accessibilityLabel="Scanner — bientôt disponible"
            />
          </View>
        </View>

        {/* Alerte crédits bas */}
        {(profile?.credits ?? 0) === 0 ? (
          <View className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
            <Ionicons name="warning-outline" size={18} color="#C4A882" />
            <Text className="text-sm text-amber-800 flex-1">
              Crédits épuisés — passez à Premium pour continuer
            </Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}
