import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cause {
  name: string;
  probability: number;
}

interface Report {
  id: string;
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  causes: Cause[];
  recommendations: string[];
  disclaimer: string;
}

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<
  Report['urgency_level'],
  { label: string; color: string; bg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  low: {
    label: 'Situation normale',
    color: '#2D5A3D',
    bg: '#EEF4F0',
    border: '#ADD1B5',
    icon: 'checkmark-circle',
  },
  medium: {
    label: 'Surveillance recommandée',
    color: '#7A5230',
    bg: '#FFF8F0',
    border: '#E4D0BB',
    icon: 'warning',
  },
  high: {
    label: 'Consultation vétérinaire',
    color: '#C0392B',
    bg: '#FFF5F5',
    border: '#FCA5A5',
    icon: 'alert-circle',
  },
  emergency: {
    label: 'Urgence — Consultez immédiatement',
    color: '#7B0000',
    bg: '#FFF0F0',
    border: '#F87171',
    icon: 'medical',
  },
};

// ─── Cause Bar ────────────────────────────────────────────────────────────────

function CauseBar({ name, probability }: Cause) {
  const pct = Math.min(100, Math.max(0, Math.round(probability)));
  const color = pct >= 60 ? '#C0392B' : pct >= 30 ? '#7A5230' : '#2D5A3D';
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, color: '#132A1C', fontWeight: '500', flex: 1, marginRight: 12 }}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#EEF4F0', borderRadius: 4, overflow: 'hidden' }}>
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DiagnosticResultScreen() {
  const { report: reportStr } = useLocalSearchParams<{ report: string }>();
  const router = useRouter();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  let report: Report | null = null;
  try {
    if (reportStr) report = JSON.parse(Array.isArray(reportStr) ? reportStr[0] : reportStr) as Report;
  } catch {
    // invalid JSON — handled below
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#C0392B" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#132A1C', marginTop: 12, textAlign: 'center' }}>
          Résultat indisponible
        </Text>
        <Text style={{ fontSize: 13, color: '#687068', marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
          Une erreur est survenue lors de la récupération du résultat.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour au diagnostic"
          style={{
            marginTop: 20,
            backgroundColor: '#2D5A3D',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFF8F0', fontWeight: '600', fontSize: 15 }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const cfg = URGENCY_CONFIG[report.urgency_level] ?? URGENCY_CONFIG.medium;

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleShare() {
    const causeLines = report!.causes.map((c) => `• ${c.name} (${Math.round(c.probability)}%)`);
    const recLines = report!.recommendations.map((r) => `• ${r}`);
    const text = [
      'Résultat PawDoc IA',
      `Niveau : ${cfg.label}`,
      '',
      'Causes probables :',
      ...causeLines,
      '',
      'Recommandations :',
      ...recLines,
      '',
      report!.disclaimer,
    ].join('\n');
    try {
      await Share.share({ message: text });
    } catch {
      // user cancelled or share failed — silently ignore
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency indicator */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: cfg.bg,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: cfg.border,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
          accessibilityRole="alert"
          accessibilityLabel={`Niveau d'urgence : ${cfg.label}`}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: cfg.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
              flexShrink: 0,
            }}
          >
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: cfg.color, lineHeight: 22 }}>
              {cfg.label}
            </Text>
            <Text style={{ fontSize: 12, color: '#687068', marginTop: 4 }}>
              Analyse PawDoc IA
            </Text>
          </View>
        </View>

        {/* Probable causes */}
        {report.causes.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#2D5A3D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={sectionLabel}>CAUSES PROBABLES</Text>
            <View style={{ marginTop: 16 }}>
              {report.causes.map((c, i) => (
                <CauseBar key={i} name={c.name} probability={c.probability} />
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#2D5A3D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={sectionLabel}>RECOMMANDATIONS</Text>
            <View style={{ marginTop: 16, gap: 4 }}>
              {report.recommendations.map((rec, i) => {
                const done = checked.has(i);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleCheck(i)}
                    activeOpacity={0.75}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={rec}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      paddingVertical: 10,
                      minHeight: 44,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: done ? '#2D5A3D' : '#C4A882',
                        backgroundColor: done ? '#2D5A3D' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    >
                      {done && <Ionicons name="checkmark" size={13} color="#FFF8F0" />}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: done ? '#9AA49A' : '#132A1C',
                        lineHeight: 20,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}
                    >
                      {rec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* CTAs */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 10 }}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://www.ordre-veto.fr/annuaire/recherche-veterinaire'
              ).catch(() => {})
            }
            activeOpacity={0.85}
            accessibilityRole="link"
            accessibilityLabel="Trouver un vétérinaire"
            style={{
              backgroundColor: '#2D5A3D',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              minHeight: 52,
            }}
          >
            <Ionicons name="location" size={18} color="#FFF8F0" />
            <Text style={{ color: '#FFF8F0', fontSize: 16, fontWeight: '700' }}>
              Trouver un vétérinaire
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Partager avec mon vétérinaire"
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              minHeight: 52,
              borderWidth: 1.5,
              borderColor: '#ADD1B5',
              backgroundColor: '#EEF4F0',
            }}
          >
            <Ionicons name="share-social-outline" size={18} color="#2D5A3D" />
            <Text style={{ color: '#2D5A3D', fontSize: 15, fontWeight: '600' }}>
              Partager avec mon vétérinaire
            </Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            backgroundColor: '#F5F1EB',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: '#687068', lineHeight: 18 }}>
            {report.disclaimer}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionLabel = {
  fontSize: 12 as const,
  fontWeight: '700' as const,
  color: '#687068',
  letterSpacing: 0.5,
};
