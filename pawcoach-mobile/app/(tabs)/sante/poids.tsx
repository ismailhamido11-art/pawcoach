import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import WeightChart, { WeightPoint } from '../../../components/health/WeightChart';
import { HealthRecord } from '../../../components/health/VaccineCard';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ h, rounded = 8 }: { h: number; rounded?: number }) {
  return <View style={{ height: h, borderRadius: rounded, backgroundColor: '#E8EDEA', marginBottom: 8 }} />;
}

function PoidsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
      <Skeleton h={80} rounded={16} />
      <Skeleton h={200} rounded={12} />
      {[1, 2, 3].map((i) => <Skeleton key={i} h={56} />)}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Normal weight range by breed category (approximate, kg)
const BREED_NORMAL: Record<string, [number, number]> = {
  'Chihuahua':    [1.5, 3],
  'Yorkshire':    [2, 3.5],
  'Bichon':       [3, 6],
  'Carlin':       [6, 9],
  'Beagle':       [9, 13],
  'Cocker':       [11, 14],
  'Border Collie': [14, 22],
  'Labrador':     [25, 36],
  'Golden':       [25, 34],
  'Berger Allemand': [22, 40],
  'Husky':        [16, 27],
  'Malinois':     [20, 30],
};

function getNormalRange(breed: string | null): [number, number] | null {
  if (!breed) return null;
  for (const [key, range] of Object.entries(BREED_NORMAL)) {
    if (breed.toLowerCase().includes(key.toLowerCase())) return range;
  }
  return null;
}

// ─── Weight Row ───────────────────────────────────────────────────────────────

function WeightRow({ record, onPress }: { record: HealthRecord; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${record.value} kg le ${formatDateFr(record.date)}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        minHeight: 56,
        shadowColor: '#2D5A3D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF4F0', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="scale" size={18} color="#2D5A3D" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#132A1C' }}>
          {record.value} kg
        </Text>
        <Text style={{ fontSize: 12, color: '#687068', marginTop: 2 }}>{formatDateFr(record.date)}</Text>
      </View>
      <Ionicons name="pencil-outline" size={16} color="#C4A882" />
    </TouchableOpacity>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface WeightForm { value: string; date: string; notes: string }
const EMPTY_FORM: WeightForm = { value: '', date: '', notes: '' };

function WeightFormModal({
  visible,
  editing,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  visible: boolean;
  editing: HealthRecord | null;
  onClose: () => void;
  onSave: (form: WeightForm) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<WeightForm>(EMPTY_FORM);

  useEffect(() => {
    if (visible) {
      setForm(
        editing
          ? { value: String(editing.value ?? ''), date: editing.date, notes: editing.notes ?? '' }
          : EMPTY_FORM
      );
    }
  }, [visible, editing]);

  const canSave = form.value.trim().length > 0 && !isNaN(parseFloat(form.value)) && form.date.trim().length > 0;

  function confirmDelete() {
    if (!editing) return;
    Alert.alert(
      'Supprimer cette pesée ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(editing.id) },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} accessibilityViewIsModal>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
        accessibilityLabel="Fermer"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4D0BB' }} />
            </View>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#132A1C' }}>
                {editing ? 'Modifier la pesée' : 'Ajouter une pesée'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF4F0', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={18} color="#687068" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
              <View>
                <Text style={fieldLabel}>Poids (kg) *</Text>
                <TextInput
                  value={form.value}
                  onChangeText={(v) => setForm((f) => ({ ...f, value: v }))}
                  placeholder="Ex : 12.5"
                  placeholderTextColor="#C4A882"
                  style={fieldInput}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Poids en kilogrammes"
                />
              </View>

              <View>
                <Text style={fieldLabel}>Date de pesée *</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="#C4A882"
                  style={fieldInput}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Date de pesée au format AAAA-MM-JJ"
                />
              </View>

              <View>
                <Text style={fieldLabel}>Notes</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                  placeholder="Vétérinaire, contexte..."
                  placeholderTextColor="#C4A882"
                  style={[fieldInput, { height: 64, textAlignVertical: 'top' }]}
                  multiline
                  accessibilityLabel="Notes sur la pesée"
                />
              </View>

              <TouchableOpacity
                onPress={() => onSave(form)}
                disabled={!canSave || saving}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={saving ? 'Enregistrement en cours' : 'Enregistrer la pesée'}
                accessibilityState={{ disabled: !canSave || saving }}
                style={{
                  backgroundColor: '#2D5A3D',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 48,
                  opacity: !canSave || saving ? 0.5 : 1,
                }}
              >
                {saving ? <ActivityIndicator size="small" color="#FFF8F0" /> : <Ionicons name="checkmark" size={18} color="#FFF8F0" />}
                <Text style={{ color: '#FFF8F0', fontSize: 16, fontWeight: '700' }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>

              {editing && (
                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={saving}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer cette pesée"
                  style={{
                    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                    flexDirection: 'row', justifyContent: 'center', gap: 8,
                    minHeight: 48, borderWidth: 1.5, borderColor: '#FCA5A5',
                    backgroundColor: '#FFF5F5', opacity: saving ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#C0392B" />
                  <Text style={{ color: '#C0392B', fontSize: 15, fontWeight: '600' }}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const fieldLabel = { fontSize: 13 as const, fontWeight: '600' as const, color: '#132A1C', marginBottom: 6 };
const fieldInput = {
  backgroundColor: '#F5F1EB', borderRadius: 10, borderWidth: 1,
  borderColor: '#E4D0BB', paddingHorizontal: 14, paddingVertical: 12,
  fontSize: 15 as const, color: '#132A1C', minHeight: 48,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PoidsScreen() {
  const { user } = useAuth();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [dogBreed, setDogBreed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id, breed')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (!dogs || dogs.length === 0) { setLoading(false); return; }
      const dog = dogs[0];
      setDogBreed(dog.breed ?? null);

      const { data, error: e } = await supabase
        .from('health_records')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('type', 'weight')
        .order('date', { ascending: true });
      if (e) throw e;
      setRecords((data as HealthRecord[]) ?? []);
    } catch (e) {
      setError('Impossible de charger le suivi poids.');
      console.warn('[Poids] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function getDogId(): Promise<string | null> {
    if (!user) return null;
    const { data } = await supabase.from('dogs').select('id').eq('owner_id', user.id).order('created_at', { ascending: true }).limit(1);
    return data?.[0]?.id ?? null;
  }

  const handleSave = async (form: { value: string; date: string; notes: string }) => {
    setSaving(true);
    try {
      const weightValue = parseFloat(form.value);
      if (editing) {
        await supabase.from('health_records').update({
          value: weightValue, date: form.date.trim(), notes: form.notes.trim() || null,
        }).eq('id', editing.id);
      } else {
        const dogId = await getDogId();
        if (!dogId) return;
        await supabase.from('health_records').insert({
          dog_id: dogId, type: 'weight', title: 'Pesée',
          value: weightValue, date: form.date.trim(), notes: form.notes.trim() || null,
        });
      }
      setModalVisible(false);
      setEditing(null);
      await loadData();
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await supabase.from('health_records').delete().eq('id', id);
      setModalVisible(false);
      setEditing(null);
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        <PoidsSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#C0392B" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#132A1C', marginTop: 12, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={loadData}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          style={{ marginTop: 16, backgroundColor: '#2D5A3D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: '#FFF8F0', fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Derived data
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData: WeightPoint[] = sorted
    .filter((r) => r.value !== null)
    .map((r) => ({ date: r.date, value: r.value as number }));

  const latest = sorted[sorted.length - 1] ?? null;
  const prev = sorted[sorted.length - 2] ?? null;
  const diff = latest && prev && latest.value !== null && prev.value !== null
    ? (latest.value as number) - (prev.value as number)
    : null;

  const [normalMin, normalMax] = getNormalRange(dogBreed) ?? [null, null];

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Current weight summary */}
        {latest ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#2D5A3D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#687068', fontWeight: '500', marginBottom: 4 }}>POIDS ACTUEL</Text>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#132A1C' }}>
                {latest.value} kg
              </Text>
              <Text style={{ fontSize: 12, color: '#687068', marginTop: 4 }}>
                {formatDateFr(latest.date)}
              </Text>
            </View>
            {diff !== null && (
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: diff > 0 ? '#FFF5F5' : diff < 0 ? '#EEF4F0' : '#F5F1EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name={diff > 0 ? 'trending-up' : diff < 0 ? 'trending-down' : 'remove'}
                  size={20}
                  color={diff > 0 ? '#C0392B' : diff < 0 ? '#2D5A3D' : '#687068'}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: diff > 0 ? '#C0392B' : diff < 0 ? '#2D5A3D' : '#687068',
                    marginTop: 4,
                  }}
                >
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                </Text>
                <Text style={{ fontSize: 10, color: '#687068', marginTop: 2 }}>vs précédent</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Chart */}
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#687068', marginBottom: 12, letterSpacing: 0.5 }}>COURBE D'ÉVOLUTION</Text>
          <WeightChart
            data={chartData}
            normalMin={normalMin ?? undefined}
            normalMax={normalMax ?? undefined}
          />
          {normalMin && normalMax && (
            <Text style={{ fontSize: 11, color: '#687068', marginTop: 8, textAlign: 'center' }}>
              Zone normale {dogBreed ? `pour ${dogBreed}` : ''} : {normalMin}–{normalMax} kg
            </Text>
          )}
        </View>

        {/* History */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#687068', marginBottom: 10, letterSpacing: 0.5 }}>
            HISTORIQUE
          </Text>

          {records.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="scale-outline" size={56} color="#ADD1B5" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#132A1C', marginTop: 16, textAlign: 'center' }}>
                Aucune pesée enregistrée
              </Text>
              <Text style={{ fontSize: 13, color: '#687068', marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                Commencez le suivi en ajoutant la première pesée.
              </Text>
              <TouchableOpacity
                onPress={() => { setEditing(null); setModalVisible(true); }}
                accessibilityRole="button"
                accessibilityLabel="Ajouter une pesée"
                style={{ marginTop: 16, backgroundColor: '#2D5A3D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFF8F0', fontWeight: '600', fontSize: 15 }}>Ajouter une pesée</Text>
              </TouchableOpacity>
            </View>
          ) : (
            [...sorted].reverse().map((r) => (
              <WeightRow
                key={r.id}
                record={r}
                onPress={() => { setEditing(r); setModalVisible(true); }}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditing(null); setModalVisible(true); }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une pesée"
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#2D5A3D', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF8F0" />
      </TouchableOpacity>

      <WeightFormModal
        visible={modalVisible}
        editing={editing}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
      />
    </SafeAreaView>
  );
}
