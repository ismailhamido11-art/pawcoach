import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // RevenueCat SDK init
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    if (apiKey) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey });
      console.log('[RevenueCat] SDK configured');
    } else {
      console.warn('[RevenueCat] EXPO_PUBLIC_REVENUECAT_API_KEY not set');
    }

    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF8F0' },
        headerTintColor: '#2D5A3D',
        contentStyle: { backgroundColor: '#FFF8F0' },
      }}
    />
  );
}
