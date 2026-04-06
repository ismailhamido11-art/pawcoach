import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function NutritionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.forest[500],
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: Colors.cream },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Alimentaire', headerBackTitle: 'Nutrition' }} />
      <Stack.Screen name="scan-result" options={{ title: 'Résultat', headerBackTitle: 'Scan' }} />
      <Stack.Screen name="plan" options={{ title: 'Plan Nutrition', headerBackTitle: 'Nutrition' }} />
    </Stack>
  );
}
