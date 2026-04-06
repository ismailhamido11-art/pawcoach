import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DangerCategory = 'safe' | 'caution' | 'toxic';

export interface ScanResult {
  id: string;
  food_name: string;
  danger_category: DangerCategory;
  toxicity_score: number;
  summary: string;
  details?: string;
  reasons: string[];
  emergency_steps?: string[];
  alternatives?: string[];
  recommendation?: string;
  disclaimer: string;
}

// ─── Danger config ────────────────────────────────────────────────────────────

const DANGER_CONFIG: Record<DangerCategory, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  safe: {
    label: 'SANS DANGER',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#A7F3D0',
    icon: 'checkmark-circle',
  },
  caution: {
    label: 'ATTENTION',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'warning',
  },
  toxic: {
    label: 'TOXIQUE',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: 'alert-circle',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  scan: ScanResult;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FoodScanResult({ scan }: Props) {
  const cfg = DANGER_CONFIG[scan.danger_category] ?? DANGER_CONFIG.caution;
  const score = Math.min(10, Math.max(0, scan.toxicity_score));
  const scorePct = (score / 10) * 100;

  return (
    <View>
      {/* ── Toxicity Badge ─────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: cfg.bg,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: cfg.border,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginBottom: 12,
        }}
        accessibilityRole="alert"
        accessibilityLabel={`Résultat : ${cfg.label}`}
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
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 2,
            flexShrink: 0,
          }}
        >
          <Ionicons name={cfg.icon} size={28} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: cfg.color, letterSpacing: 0.5 }}>
            {cfg.label}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.forest[800], marginTop: 2 }}>
            {scan.food_name}
          </Text>
        </View>
      </View>

      {/* ── Toxicity Score Bar ─────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: Colors.white,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          shadowColor: Colors.forest[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5 }}>
            SCORE DE TOXICITÉ
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: cfg.color }}>
            {score}/10
          </Text>
        </View>
        <View
          style={{ height: 10, backgroundColor: Colors.forest[50], borderRadius: 5, overflow: 'hidden' }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 10, now: score }}
        >
          <View
            style={{
              width: `${scorePct}%`,
              height: '100%',
              backgroundColor: cfg.color,
              borderRadius: 5,
            }}
          />
        </View>
        {scan.summary ? (
          <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 10, lineHeight: 18 }}>
            {scan.summary}
          </Text>
        ) : null}
      </View>

      {/* ── Reasons ────────────────────────────────────────────────────────── */}
      {scan.reasons?.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            shadowColor: Colors.forest[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 12 }}>
            POURQUOI
          </Text>
          <View style={{ gap: 8 }}>
            {scan.reasons.map((reason, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: cfg.color,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <Text style={{ flex: 1, fontSize: 14, color: Colors.forest[800], lineHeight: 20 }}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Emergency (toxic only) ─────────────────────────────────────────── */}
      {scan.danger_category === 'toxic' && scan.emergency_steps && scan.emergency_steps.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.emergencyBg,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: Colors.emergencyBorder,
            padding: 16,
            marginBottom: 12,
          }}
          accessibilityRole="alert"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="medical" size={18} color={Colors.emergency} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.emergency }}>
              Que faire maintenant
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {scan.emergency_steps.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.emergency, marginTop: 2, width: 16 }}>
                  {i + 1}.
                </Text>
                <Text style={{ flex: 1, fontSize: 14, color: Colors.forest[800], lineHeight: 20 }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
          {/* Vet CTA */}
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:').catch(() => {})}
            activeOpacity={0.85}
            accessibilityRole="link"
            accessibilityLabel="Appeler un vétérinaire"
            style={{
              marginTop: 14,
              backgroundColor: Colors.emergency,
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
            }}
          >
            <Ionicons name="call" size={18} color={Colors.white} />
            <Text style={{ color: Colors.white, fontSize: 15, fontWeight: '700' }}>
              Appeler un vétérinaire
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Alternatives ──────────────────────────────────────────────────── */}
      {scan.alternatives && scan.alternatives.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            shadowColor: Colors.forest[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 12 }}>
            ALTERNATIVES SÛRES
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {scan.alternatives.map((alt, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: Colors.forest[50],
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name="checkmark" size={12} color="#10B981" />
                <Text style={{ fontSize: 13, color: Colors.forest[700], fontWeight: '500' }}>
                  {alt}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Recommendation ────────────────────────────────────────────────── */}
      {scan.recommendation && (
        <View
          style={{
            backgroundColor: Colors.forest[50],
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <Ionicons name="bulb-outline" size={16} color={Colors.forest[400]} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.muted, lineHeight: 18 }}>
            {scan.recommendation}
          </Text>
        </View>
      )}

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: Colors.fieldBg,
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 11, color: Colors.muted, lineHeight: 16 }}>
          {scan.disclaimer}
        </Text>
      </View>
    </View>
  );
}
