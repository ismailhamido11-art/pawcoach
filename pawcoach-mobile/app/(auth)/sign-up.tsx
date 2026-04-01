import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = fullName.trim().length >= 2 && email.includes('@') && password.length >= 8;

  const handleSignUp = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (authError) throw authError;
      // La redirection est gérée par onAuthStateChange dans AuthProvider
    } catch (e: any) {
      setError(e?.message ?? 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

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
              Créer un compte
            </Text>
            <Text className="text-base text-forest-600 mb-8">
              Rejoignez PawCoach pour coacher votre chien avec l'IA
            </Text>

            {/* Champs */}
            <View className="gap-4">
              {/* Prénom */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">
                  Prénom et nom
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Jean Dupont"
                  placeholderTextColor="#C4A882"
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Prénom et nom"
                />
              </View>

              {/* Email */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">
                  Adresse e-mail
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jean@exemple.com"
                  placeholderTextColor="#C4A882"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  returnKeyType="next"
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Adresse e-mail"
                />
              </View>

              {/* Mot de passe */}
              <View>
                <Text className="text-sm font-medium text-forest-700 mb-2">
                  Mot de passe
                </Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimum 8 caractères"
                    placeholderTextColor="#C4A882"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    className="h-14 bg-white border border-earth-200 rounded-xl px-4 pr-14 text-base text-forest-800"
                    accessibilityLabel="Mot de passe, minimum 8 caractères"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 h-14 w-14 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#7BB690"
                    />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-forest-500 mt-2">
                  Minimum 8 caractères
                </Text>
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
              onPress={handleSignUp}
              disabled={!isValid || loading}
              className={`mt-8 h-14 rounded-xl items-center justify-center ${
                isValid && !loading ? 'bg-forest-500' : 'bg-forest-200 opacity-50'
              }`}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Création en cours…' : 'Créer mon compte'}
              accessibilityState={{ disabled: !isValid || loading }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF8F0" />
              ) : (
                <Text className="text-base font-semibold text-cream">
                  Créer mon compte
                </Text>
              )}
            </TouchableOpacity>

            {/* Lien connexion */}
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-in')}
              className="mt-6 h-11 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="J'ai déjà un compte, se connecter"
            >
              <Text className="text-sm text-forest-600">
                Déjà un compte ?{' '}
                <Text className="font-semibold text-forest-500">Se connecter</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
