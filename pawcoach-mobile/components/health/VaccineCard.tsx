import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface HealthRecord {
  id: string;
  dog_id: string;
  type: 'vaccine' | 'weight';
  title: string;
  date: string;
  next_date: string | null;
  value: number | null;
  notes: string | null;
}

type VaccineStatus = 'ok' | 'soon' | 'expired' | 'unknown';

function getVaccineStatus(nextDate: string | null): VaccineStatus {
  if (!nextDate) return 'unknown';
  const now = new Date();
  const next = new Date(nextDate);
  const diffDays = Math.floor((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

const STATUS_CONFIG: Record<VaccineStatus, { color: string; bg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  ok:      { color: '#2D5A3D', bg: '#EEF4F0', border: '#ADD1B5', icon: 'checkmark-circle', label: 'À jour' },
  soon:    { color: '#7A5230', bg: '#FFF8F0', border: '#E4D0BB', icon: 'time',             label: 'Bientôt' },
  expired: { color: '#C0392B', bg: '#FFF5F5', border: '#FCA5A5', icon: 'alert-circle',    label: 'Expiré' },
  unknown: { color: '#687068', bg: '#F5F5F5', border: '#E5E5E5', icon: 'help-circle',     label: 'Inconnu' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  vaccine: HealthRecord;
  onPress?: (vaccine: HealthRecord) => void;
}

export default function VaccineCard({ vaccine, onPress }: Props) {
  const status = getVaccineStatus(vaccine.next_date);
  const cfg = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      onPress={() => onPress?.(vaccine)}
      disabled={!onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Vaccin ${vaccine.title}, statut : ${cfg.label}`}
      style={{
        minHeight: 44,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E4D0BB',
        padding: 16,
        marginBottom: 8,
        shadowColor: '#2D5A3D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Status icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: cfg.bg,
            borderWidth: 1,
            borderColor: cfg.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: '#132A1C', lineHeight: 20 }}
            numberOfLines={1}
          >
            {vaccine.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#687068', marginTop: 2 }}>
            Administré le {formatDate(vaccine.date)}
          </Text>
          {vaccine.next_date && (
            <Text style={{ fontSize: 12, color: cfg.color, marginTop: 2 }}>
              Prochain : {formatDate(vaccine.next_date)}
            </Text>
          )}
        </View>

        {/* Status badge */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            backgroundColor: cfg.bg,
            borderWidth: 1,
            borderColor: cfg.border,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export { getVaccineStatus };
export type { VaccineStatus };
