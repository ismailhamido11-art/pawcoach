import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';

export default function ProfilScreen() {
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 px-6 pt-8">
        {/* Avatar + nom */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-forest-100 items-center justify-center mb-3">
            <Ionicons name="person-outline" size={36} color="#2D5A3D" />
          </View>
          <Text className="text-xl font-bold text-forest-800">
            {profile?.full_name ?? '—'}
          </Text>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={signOut}
          className="mt-auto mb-4 h-14 border border-red-300 rounded-xl items-center justify-center flex-row gap-2"
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#C0392B" />
          <Text className="text-base font-medium text-red-600">Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
