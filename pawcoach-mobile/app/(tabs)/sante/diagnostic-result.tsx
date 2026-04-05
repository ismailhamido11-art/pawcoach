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
import { Colors } from '../../../constants/theme';

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
    color: Colors.forest[500],
    bg: Colors.forest[50],
    border: Colors.forest[200],
    icon: 'checkmark-circle',
  },
  medium: {
    label: 'Surveillance recommandée',
    color: Colors.earth[500],
    bg: Colors.cream,
    border: Colors.earth[200],
    icon: 'warning',
  },
  high: {
    label: 'Consultation vétérinaire',
    color: Colors.error,
    bg: Colors.errorBg,
    border: Colors.errorBorder,
    icon: 'alert-circle',
  },
  emergency: {
    label: 'Urgence — Consultez immédiatement',
    color: Colors.emergency,
    bg: Colors.emergencyBg,
    border: Colors.emergencyBorder,
    icon: 'medical',
  },
};

// ─── Cause Bar ────────────────────────────────────────────────────────────────

function CauseBar({ name, probability }: Cause) {
  const pct = Math.min(100, Math.max(0, Math.round(probability)));
  const color = pct >= 60 ? Colors.error : pct >= 30 ? Colors.earth[500] : Colors.forest[500];
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, color: Colors.forest[800], fontWeight: '500', flex: 1, marginRight: 12 }}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: Colors.forest[50], borderRadius: 4, overflow: 'hidden' }}>
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
          accessibilityLabel="Retour au diagnostic"
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
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
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
              backgroundColor: Colors.white,
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
            <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 4 }}>
              Analyse PawDoc IA
            </Text>
          </View>
        </View>

        {/* Probable causes */}
        {report.causes?.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: Colors.white,
              borderRadius: 16,
              padding: 20,
              shadowColor: Colors.forest[500],
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
        {report.recommendations?.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: Colors.white,
              borderRadius: 16,
              padding: 20,
              shadowColor: Colors.forest[500],
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
                        borderColor: done ? Colors.forest[500] : Colors.earth[300],
                        backgroundColor: done ? Colors.forest[500] : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    >
                      {done && <Ionicons name="checkmark" size={13} color={Colors.cream} />}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: done ? Colors.done : Colors.forest[800],
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
              backgroundColor: Colors.forest[500],
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              minHeight: 52,
            }}
          >
            <Ionicons name="location" size={18} color={Colors.cream} />
            <Text style={{ color: Colors.cream, fontSize: 16, fontWeight: '700' }}>
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
              borderColor: Colors.forest[200],
              backgroundColor: Colors.forest[50],
            }}
          >
            <Ionicons name="share-social-outline" size={18} color={Colors.forest[500]} />
            <Text style={{ color: Colors.forest[500], fontSize: 15, fontWeight: '600' }}>
              Partager avec mon vétérinaire
            </Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            backgroundColor: Colors.fieldBg,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: Colors.muted, lineHeight: 18 }}>
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
  color: Colors.muted,
  letterSpacing: 0.5,
};
