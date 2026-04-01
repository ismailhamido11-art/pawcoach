import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-forest-100 items-center justify-center mb-4">
          <Ionicons name="nutrition-outline" size={32} color="#2D5A3D" />
        </View>
        <Text className="text-xl font-bold text-forest-800 mb-2">Nutrition</Text>
        <Text className="text-sm text-forest-500 text-center">
          Suivi nutritionnel — bientôt disponible
        </Text>
      </View>
    </SafeAreaView>
  );
}
