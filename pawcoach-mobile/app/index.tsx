import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 px-4 py-8">
        <Text className="text-4xl font-bold text-forest-500 mb-2">
          PawCoach
        </Text>
        <Text className="text-base text-forest-400">
          Your AI-powered dog coaching app
        </Text>
        {/* NativeWind test: bg-forest-500 + text-cream */}
        <View className="mt-8 rounded-lg bg-forest-500 px-4 py-3">
          <Text className="text-base font-medium text-cream">
            NativeWind v4 — OK
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
