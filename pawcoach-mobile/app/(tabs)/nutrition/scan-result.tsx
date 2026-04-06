import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FoodScanResult, { type ScanResult } from '../../../components/nutrition/FoodScanResult';
import { Colors } from '../../../constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanResultScreen() {
  const { scan: scanStr } = useLocalSearchParams<{ scan: string }>();
  const router = useRouter();

  let scan: ScanResult | null = null;
  try {
    if (scanStr) {
      const raw = Array.isArray(scanStr) ? scanStr[0] : scanStr;
      scan = JSON.parse(raw) as ScanResult;
    }
  } catch {
    // invalid JSON — handled below
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (!scan) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 12, textAlign: 'center' }}>
          Résultat indisponible
        </Text>
        <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
          Une erreur est survenue lors de la récupération du résultat.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour au scan"
          style={{
            marginTop: 20,
            backgroundColor: Colors.forest[500],
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: Colors.cream, fontWeight: '600', fontSize: 15 }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Result card content */}
        <FoodScanResult scan={scan} />

        {/* Secondary CTA */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Scanner un autre aliment"
          style={{
            marginTop: 16,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            minHeight: 52,
            borderWidth: 1.5,
            borderColor: Colors.forest[200],
            backgroundColor: Colors.forest[50],
          }}
        >
          <Ionicons name="search-outline" size={18} color={Colors.forest[500]} />
          <Text style={{ color: Colors.forest[500], fontSize: 15, fontWeight: '600' }}>
            Scanner un autre aliment
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
