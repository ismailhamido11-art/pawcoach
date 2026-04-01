import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure le comportement des notifications reçues en avant-plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Demande la permission et enregistre le token push.
 * Appelé une fois après la connexion de l'utilisateur.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    // Demande de permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission refusée');
      return;
    }

    // Sur Android, un canal par défaut est nécessaire
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PawCoach',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }

    // Récupération du token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('[Push] Token:', token);

    // Envoi à Supabase via edge function
    await supabase.functions.invoke('register-push-token', {
      body: { userId, token, platform: Platform.OS },
    });

    console.log('[Push] Token enregistré avec succès');
  } catch (err) {
    // Non bloquant — l'app fonctionne sans push
    console.warn('[Push] Erreur enregistrement token:', err);
  }
}
