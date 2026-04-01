import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PawCoach',
  slug: 'pawcoach-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'pawcoach',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFF8F0',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.skoolora.pawcoach',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.skoolora.pawcoach',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFF8F0',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
    'expo-apple-authentication',
    // TODO: remplacer IOS_CLIENT_ID par le vrai ID fourni par le CEO (Google Cloud Console)
    ['@react-native-google-signin/google-signin', {
      iosUrlScheme: 'com.googleusercontent.apps.IOS_CLIENT_ID',
    }],
  ],
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/b78bf6d0-6dbd-44e7-b9f5-d0f7e1af5250',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    eas: {
      projectId: 'b78bf6d0-6dbd-44e7-b9f5-d0f7e1af5250',
    },
  },
});
