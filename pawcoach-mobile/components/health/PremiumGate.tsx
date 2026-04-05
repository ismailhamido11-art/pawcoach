import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
  title?: string;
  subtitle?: string;
}

const FEATURES = [
  { icon: 'medkit' as const,          label: 'Diagnostic IA PawDoc illimité' },
  { icon: 'notifications' as const,    label: 'Rappels vaccins par email' },
  { icon: 'bar-chart' as const,        label: 'Bilans hebdomadaires IA' },
  { icon: 'paw' as const,              label: "Jusqu'à 3 chiens" },
];

export default function PremiumGate({ title, subtitle }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    // Fetch offerings from RevenueCat dynamically (optional — not available in Expo Go)
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.getOfferings().then((offerings: { current: { availablePackages: { product: { priceString: string } }[] } | null }) => {
        const monthly = offerings.current?.availablePackages?.[0];
        if (monthly) setPrice(monthly.product.priceString);
      }).catch(() => {
        setPrice('7,99 €/mois');
      });
    } catch {
      setPrice('7,99 €/mois');
    }
  }, []);

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.availablePackages?.[0];
      if (monthly) {
        await Purchases.purchasePackage(monthly);
      } else {
        // Fallback: navigate to premium page
        router.push('/profil');
      }
    } catch {
      // User cancelled or error — silently ignore
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={styles.container} accessibilityRole="none">
      {/* Blur-like overlay behind */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.overlay} />
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Crown icon */}
        <View style={styles.iconWrapper}>
          <Ionicons name="star" size={28} color="#2D5A3D" />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {title ?? 'PawCoach Premium'}
        </Text>
        <Text style={styles.subtitle}>
          {subtitle ?? 'Débloquez le diagnostic IA et bien plus'}
        </Text>

        {/* Features list */}
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIconWrapper}>
                <Ionicons name={f.icon} size={16} color="#2D5A3D" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          {price ? (
            <Text style={styles.priceText}>{price}</Text>
          ) : (
            <ActivityIndicator size="small" color="#2D5A3D" />
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleUpgrade}
          disabled={purchasing}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Passer à Premium"
          accessibilityState={{ disabled: purchasing }}
          style={[styles.ctaButton, purchasing && styles.ctaDisabled]}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#FFF8F0" />
          ) : (
            <>
              <Ionicons name="star" size={18} color="#FFF8F0" />
              <Text style={styles.ctaLabel}>Passer Premium</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Résiliation facile depuis l'App Store ou Google Play
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 241, 235, 0.88)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#2D5A3D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#132A1C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#687068',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    color: '#132A1C',
    flex: 1,
    lineHeight: 20,
  },
  priceRow: {
    marginBottom: 16,
    height: 24,
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5A3D',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D5A3D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    minHeight: 48,
    marginBottom: 12,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF8F0',
  },
  legalNote: {
    fontSize: 11,
    color: '#687068',
    textAlign: 'center',
    lineHeight: 16,
  },
});
