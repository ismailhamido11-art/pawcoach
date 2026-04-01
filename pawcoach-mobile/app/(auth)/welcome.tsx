import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 px-6 justify-between py-12">

        {/* Logo + tagline */}
        <View className="flex-1 items-center justify-center">
          <View
            className="w-24 h-24 rounded-2xl bg-forest-500 items-center justify-center mb-6"
            accessibilityRole="image"
            accessibilityLabel="Logo PawCoach"
          >
            <Ionicons name="paw" size={48} color="#FFF8F0" />
          </View>

          <Text
            className="text-4xl font-bold text-forest-500 mb-3"
            accessibilityRole="header"
          >
            PawCoach
          </Text>

          <Text className="text-base text-forest-600 text-center px-8 leading-6">
            L'assistant IA pour élever un chien heureux et en bonne santé
          </Text>
        </View>

        {/* CTAs */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            className="h-14 bg-forest-500 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Commencer — créer un compte"
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-cream">
              Commencer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            className="h-14 bg-transparent border border-forest-500 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="J'ai déjà un compte — se connecter"
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-forest-500">
              J'ai déjà un compte
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
