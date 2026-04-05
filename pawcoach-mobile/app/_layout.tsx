import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useProtectedRoute } from '../lib/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // RevenueCat — loaded dynamically to avoid crash in Expo Go
    // (native module not available in Expo Go runtime)
    try {
      const Purchases = require('react-native-purchases').default;
      const { LOG_LEVEL } = require('react-native-purchases');
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (apiKey && !apiKey.startsWith('appl_your')) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey });
        console.log('[RevenueCat] SDK configured');
      } else {
        console.warn('[RevenueCat] API key not configured — skipping');
      }
    } catch {
      console.warn('[RevenueCat] Native module not available (Expo Go) — skipping');
    }

    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  useProtectedRoute();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF8F0' },
        headerTintColor: '#2D5A3D',
        contentStyle: { backgroundColor: '#FFF8F0' },
        headerShown: false,
      }}
    />
  );
}
