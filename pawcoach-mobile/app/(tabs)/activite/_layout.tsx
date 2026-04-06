import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function ActiviteLayout() {
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
      <Stack.Screen name="programme" options={{ title: 'Programme', headerBackTitle: 'Activité' }} />
      <Stack.Screen name="log-walk" options={{ title: 'Promenade', headerBackTitle: 'Activité' }} />
      <Stack.Screen name="badges" options={{ title: 'Badges', headerBackTitle: 'Activité' }} />
    </Stack>
  );
}
