import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// ─── Google Sign-In ─────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  // v14+ API: response.type === 'success' | 'cancelled' | 'noSavedCredentialFound'
  if (response.type !== 'success') return; // user cancelled

  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('Aucun token Google reçu');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
}

// ─── Apple Sign-In (iOS only) ────────────────────────────────────────────────

function generateRawNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export async function signInWithApple(): Promise<void> {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) throw new Error("Sign in with Apple non disponible sur cet appareil");

  const rawNonce = generateRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) throw new Error('Aucun token Apple reçu');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
}
