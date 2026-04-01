import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.includes('@') && password.length >= 1;

  const handleSignIn = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;
      // Redirection gérée par AuthProvider + index.tsx
    } catch {
      // [A-10] Message générique — ne révèle pas si c'est l'email ou le mot de passe
      setError('Email ou mot de passe incorrect. Réessayez.');
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
              Connexion
            </Text>
            <Text className="text-base text-forest-600 mb-8">
              Bon retour parmi nous
            </Text>

            {/* Champs */}
            <View className="gap-4">
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

              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-forest-700">
                    Mot de passe
                  </Text>
                  {/* [A-04] Mot de passe oublié — accessible et bien placé */}
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/forgot-password')}
                    className="h-8 justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Mot de passe oublié"
                  >
                    <Text className="text-sm font-medium text-forest-500">
                      Mot de passe oublié ?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#C4A882"
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    className="h-14 bg-white border border-earth-200 rounded-xl px-4 pr-14 text-base text-forest-800"
                    accessibilityLabel="Mot de passe"
                  />
                  {/* [A-06] Toggle visibilité mot de passe */}
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
              onPress={handleSignIn}
              disabled={!isValid || loading}
              className={`mt-8 h-14 rounded-xl items-center justify-center ${
                isValid && !loading ? 'bg-forest-500' : 'bg-forest-200 opacity-50'
              }`}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Connexion en cours…' : 'Se connecter'}
              accessibilityState={{ disabled: !isValid || loading }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF8F0" />
              ) : (
                <Text className="text-base font-semibold text-cream">
                  Se connecter
                </Text>
              )}
            </TouchableOpacity>

            {/* Lien inscription */}
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-up')}
              className="mt-6 h-11 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Pas encore de compte, créer un compte"
            >
              <Text className="text-sm text-forest-600">
                Pas encore de compte ?{' '}
                <Text className="font-semibold text-forest-500">S'inscrire</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
