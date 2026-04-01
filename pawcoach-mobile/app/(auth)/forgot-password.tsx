import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.includes('@');

  const handleReset = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'pawcoach://reset-password' },
      );
      if (authError) throw authError;
      setSent(true);
    } catch {
      // Message générique — ne confirme pas si l'email existe
      setError('Une erreur est survenue. Vérifiez votre adresse et réessayez.');
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

          {sent ? (
            /* État succès */
            <View className="flex-1 items-center justify-center px-4">
              <View className="w-20 h-20 rounded-full bg-forest-100 items-center justify-center mb-6">
                <Ionicons name="mail-outline" size={40} color="#2D5A3D" />
              </View>
              <Text className="text-2xl font-bold text-forest-800 mb-3 text-center" accessibilityRole="header">
                Email envoyé
              </Text>
              <Text className="text-base text-forest-600 text-center leading-6 mb-8">
                Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/sign-in')}
                className="h-14 w-full bg-forest-500 rounded-xl items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Retour à la connexion"
                activeOpacity={0.85}
              >
                <Text className="text-base font-semibold text-cream">
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Formulaire */
            <>
              <Text className="text-3xl font-bold text-forest-800 mb-2" accessibilityRole="header">
                Mot de passe oublié
              </Text>
              <Text className="text-base text-forest-600 mb-8">
                Entrez votre adresse e-mail pour recevoir un lien de réinitialisation
              </Text>

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
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                  className="h-14 bg-white border border-earth-200 rounded-xl px-4 text-base text-forest-800"
                  accessibilityLabel="Adresse e-mail"
                />
              </View>

              {error ? (
                <View className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
                  <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
                  <Text className="text-sm text-red-700 flex-1">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleReset}
                disabled={!isValid || loading}
                className={`mt-8 h-14 rounded-xl items-center justify-center ${
                  isValid && !loading ? 'bg-forest-500' : 'bg-forest-200 opacity-50'
                }`}
                accessibilityRole="button"
                accessibilityLabel={loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                accessibilityState={{ disabled: !isValid || loading }}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF8F0" />
                ) : (
                  <Text className="text-base font-semibold text-cream">
                    Envoyer le lien
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
