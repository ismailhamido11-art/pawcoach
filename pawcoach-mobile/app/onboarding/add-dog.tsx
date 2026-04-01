import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────

type Sex = 'male' | 'female' | null;

// ─── Screen ────────────────────────────────────────────────────────────────

export default function AddDogScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Sex>(null);
  const [weight, setWeight] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isValid = name.trim().length >= 1;

  const formatBirthDate = (raw: string): string => {
    // Accepte JJ/MM/AAAA → AAAA-MM-JJ pour Supabase
    const parts = raw.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return raw;
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        breed: breed.trim() || null,
        birth_date: birthDate ? formatBirthDate(birthDate) : null,
        sex: sex ?? null,
        weight: weight ? parseFloat(weight.replace(',', '.')) : null,
      };

      const { error: fnError, data } = await supabase.functions.invoke('create-dog', { body });

      if (fnError) {
        // Gérer la limite de chiens
        const status = (fnError as any)?.context?.status ?? (data as any)?.status;
        if (status === 429 || (fnError.message ?? '').includes('dog_limit_reached')) {
          setError('Limite atteinte — passez à Premium pour ajouter plusieurs chiens.');
        } else {
          throw fnError;
        }
        return;
      }

      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // ── État succès ────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-cream">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-forest-100 items-center justify-center mb-6">
            <Ionicons name="paw" size={48} color="#2D5A3D" />
          </View>
          <Text className="text-2xl font-bold text-forest-800 mb-3 text-center" accessibilityRole="header">
            {name} rejoint l'aventure ! 🐾
          </Text>
          <Text className="text-base text-forest-600 text-center leading-6 mb-8">
            Votre compagnon est prêt. Commencez par une session de chat IA !
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="h-14 w-full bg-forest-500 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Aller au tableau de bord"
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-cream">
              Voir le tableau de bord
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4 pb-8">

            {/* Header */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 items-center justify-center -ml-2 mb-8"
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={24} color="#2D5A3D" />
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-forest-800 mb-2" accessibilityRole="header">
              Mon chien
            </Text>
            <Text className="text-base text-forest-600 mb-8">
              Créez le profil de votre compagnon
            </Text>

            <View className="gap-5">
              {/* Nom */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">
                  Nom <Text className="text-error">*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Rex, Luna, Max…"
                  placeholderTextColor="#C4A882"
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Nom du chien, champ requis"
                />
              </View>

              {/* Race */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">Race</Text>
                <TextInput
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="Labrador, Berger allemand…"
                  placeholderTextColor="#C4A882"
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Race du chien"
                />
              </View>

              {/* Sexe */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">Sexe</Text>
                <View className="flex-row gap-3">
                  {(['male', 'female'] as Sex[]).map((s) => (
                    <TouchableOpacity
                      key={s!}
                      onPress={() => setSex(s)}
                      className={`flex-1 h-14 rounded-xl border items-center justify-center flex-row gap-2 ${
                        sex === s
                          ? 'bg-forest-500 border-forest-500'
                          : 'bg-white border-earth-200'
                      }`}
                      accessibilityRole="radio"
                      accessibilityLabel={s === 'male' ? 'Mâle' : 'Femelle'}
                      accessibilityState={{ checked: sex === s }}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name={s === 'male' ? 'male-outline' : 'female-outline'}
                        size={18}
                        color={sex === s ? '#FFF8F0' : '#2D5A3D'}
                      />
                      <Text
                        className={`text-sm font-semibold ${sex === s ? 'text-cream' : 'text-forest-700'}`}
                      >
                        {s === 'male' ? 'Mâle' : 'Femelle'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date de naissance */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">Date de naissance</Text>
                <TextInput
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#C4A882"
                  keyboardType="numeric"
                  returnKeyType="next"
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Date de naissance, format JJ/MM/AAAA"
                />
              </View>

              {/* Poids */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">Poids (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="25"
                  placeholderTextColor="#C4A882"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Poids du chien en kilogrammes"
                />
              </View>
            </View>

            {/* Erreur */}
            {error ? (
              <View className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
                <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
                <Text className="text-sm text-red-700 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isValid || loading}
              className={`mt-8 h-14 rounded-xl items-center justify-center ${
                isValid && !loading ? 'bg-forest-500' : 'bg-forest-200 opacity-50'
              }`}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Enregistrement en cours…' : 'Créer le profil'}
              accessibilityState={{ disabled: !isValid || loading }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF8F0" />
              ) : (
                <Text className="text-base font-semibold text-cream">
                  Créer le profil
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
