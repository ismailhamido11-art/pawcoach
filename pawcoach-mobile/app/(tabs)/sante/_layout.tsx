import { Stack } from 'expo-router';

export default function SanteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF8F0' },
        headerTintColor: '#2D5A3D',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: '#FFF8F0' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="vaccins" options={{ title: 'Carnet Vaccins', headerBackTitle: 'Santé' }} />
      <Stack.Screen name="poids" options={{ title: 'Suivi Poids', headerBackTitle: 'Santé' }} />
      <Stack.Screen name="diagnostic" options={{ title: 'Diagnostic IA', headerBackTitle: 'Santé' }} />
      <Stack.Screen
        name="diagnostic-result"
        options={{ title: 'Résultat', headerBackTitle: 'Diagnostic' }}
      />
    </Stack>
  );
}
