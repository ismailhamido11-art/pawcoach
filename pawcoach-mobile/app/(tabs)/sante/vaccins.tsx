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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import VaccineCard, { HealthRecord, getVaccineStatus } from '../../../components/health/VaccineCard';
import { Colors } from '../../../constants/theme';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ h, rounded = 8 }: { h: number; rounded?: number }) {
  return <View style={{ height: h, borderRadius: rounded, backgroundColor: Colors.skeleton, marginBottom: 8 }} />;
}

function VaccineSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flex: 1, height: 32, borderRadius: 20, backgroundColor: Colors.skeleton }} />
        ))}
      </View>
      {[1, 2, 3].map((i) => <Skeleton key={i} h={80} />)}
    </View>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────

function Chip({ label, count, active, onPress }: { label: string; count: number; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Filtrer ${label} : ${count}`}
      accessibilityState={{ selected: active }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        minHeight: 36,
        backgroundColor: active ? Colors.forest[500] : Colors.white,
        borderWidth: 1,
        borderColor: active ? Colors.forest[500] : Colors.earth[200],
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? Colors.cream : Colors.muted }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: active ? 'rgba(255,248,240,0.25)' : Colors.forest[50],
          borderRadius: 10,
          paddingHorizontal: 6,
          paddingVertical: 1,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: active ? Colors.cream : Colors.forest[500] }}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Vaccine Form Modal ───────────────────────────────────────────────────────

interface FormState {
  title: string;
  date: string;
  nextDate: string;
  notes: string;
}

const EMPTY_FORM: FormState = { title: '', date: '', nextDate: '', notes: '' };

function VaccineFormModal({
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
  onSave: (form: FormState) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (visible) {
      setForm(
        editing
          ? {
              title: editing.title,
              date: editing.date,
              nextDate: editing.next_date ?? '',
              notes: editing.notes ?? '',
            }
          : EMPTY_FORM
      );
    }
  }, [visible, editing]);

  const canSave = form.title.trim().length > 0 && form.date.trim().length > 0;

  function confirmDelete() {
    if (!editing) return;
    Alert.alert(
      'Supprimer ce vaccin ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete(editing.id),
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
        accessibilityLabel="Fermer la fenêtre"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable onPress={() => {}} style={{ backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {/* Handle + header */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.earth[200] }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: Colors.forest[800] }}>
                {editing ? 'Modifier le vaccin' : 'Ajouter un vaccin'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.forest[50], alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Form fields */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
              <View>
                <Text style={fieldLabel}>Nom du vaccin *</Text>
                <TextInput
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="Ex : Rage, CHPPIL..."
                  placeholderTextColor={Colors.earth[300]}
                  style={fieldInput}
                  returnKeyType="next"
                  accessibilityLabel="Nom du vaccin"
                />
              </View>

              <View>
                <Text style={fieldLabel}>Date d'administration *</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.earth[300]}
                  style={fieldInput}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Date d'administration au format AAAA-MM-JJ"
                />
              </View>

              <View>
                <Text style={fieldLabel}>Prochain rappel</Text>
                <TextInput
                  value={form.nextDate}
                  onChangeText={(v) => setForm((f) => ({ ...f, nextDate: v }))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.earth[300]}
                  style={fieldInput}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Date du prochain rappel au format AAAA-MM-JJ"
                />
              </View>

              <View>
                <Text style={fieldLabel}>Notes</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                  placeholder="Vétérinaire, lot, observations..."
                  placeholderTextColor={Colors.earth[300]}
                  style={[fieldInput, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  accessibilityLabel="Notes sur le vaccin"
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                onPress={() => onSave(form)}
                disabled={!canSave || saving}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={saving ? 'Enregistrement en cours' : 'Enregistrer le vaccin'}
                accessibilityState={{ disabled: !canSave || saving }}
                style={{
                  backgroundColor: Colors.forest[500],
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
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <Ionicons name="checkmark" size={18} color={Colors.cream} />
                )}
                <Text style={{ color: Colors.cream, fontSize: 16, fontWeight: '700' }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>

              {/* Delete button — separated from save */}
              {editing && (
                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={saving}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer ce vaccin"
                  style={{
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: 48,
                    borderWidth: 1.5,
                    borderColor: Colors.errorBorder,
                    backgroundColor: Colors.errorBg,
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={{ color: Colors.error, fontSize: 15, fontWeight: '600' }}>
                    Supprimer ce vaccin
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Field styles ─────────────────────────────────────────────────────────────

const fieldLabel = {
  fontSize: 13 as const,
  fontWeight: '600' as const,
  color: Colors.forest[800],
  marginBottom: 6,
};

const fieldInput = {
  backgroundColor: Colors.fieldBg,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: Colors.earth[200],
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15 as const,
  color: Colors.forest[800],
  minHeight: 48,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'ok' | 'soon' | 'expired';

export default function VaccinsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [vaccines, setVaccines] = useState<HealthRecord[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedDogId, setCachedDogId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const loadVaccines = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Get first dog
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (!dogs || dogs.length === 0) { setLoading(false); return; }
      const dogId = dogs[0].id;
      setCachedDogId(dogId);

      const { data, error: e } = await supabase
        .from('health_records')
        .select('*')
        .eq('dog_id', dogId)
        .eq('type', 'vaccine')
        .order('date', { ascending: false });
      if (e) throw e;
      setVaccines((data as HealthRecord[]) ?? []);
    } catch (e) {
      setError('Impossible de charger les vaccins.');
      console.warn('[Vaccins] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadVaccines(); }, [loadVaccines]);

  const handleSave = async (form: FormState) => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('health_records')
          .update({
            title: form.title.trim(),
            date: form.date.trim(),
            next_date: form.nextDate.trim() || null,
            notes: form.notes.trim() || null,
          })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const dogId = cachedDogId;
        if (!dogId) {
          Alert.alert('Aucun chien', 'Ajoutez votre chien depuis l\'accueil.');
          return;
        }
        const { error } = await supabase.from('health_records').insert({
          dog_id: dogId,
          type: 'vaccine',
          title: form.title.trim(),
          date: form.date.trim(),
          next_date: form.nextDate.trim() || null,
          notes: form.notes.trim() || null,
        });
        if (error) throw error;
      }
      setModalVisible(false);
      setEditing(null);
      await loadVaccines();
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer le vaccin. Réessayez.");
      console.warn('[Vaccins] save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('health_records').delete().eq('id', id);
      if (error) throw error;
      setModalVisible(false);
      setEditing(null);
      await loadVaccines();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de supprimer. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts = vaccines.reduce(
    (acc, v) => {
      const s = getVaccineStatus(v.next_date);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { ok: 0, soon: 0, expired: 0, unknown: 0 } as Record<string, number>
  );

  const filtered = filter === 'all' ? vaccines : vaccines.filter((v) => getVaccineStatus(v.next_date) === filter);

  // ── Next urgent vaccine ────────────────────────────────────────────────────
  const nextUrgent = vaccines
    .filter((v) => getVaccineStatus(v.next_date) === 'soon' || getVaccineStatus(v.next_date) === 'expired')
    .sort((a, b) => new Date(a.next_date ?? '').getTime() - new Date(b.next_date ?? '').getTime())[0];

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <VaccineSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 12, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={loadVaccines}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement"
          style={{ marginTop: 16, backgroundColor: Colors.forest[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: Colors.cream, fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Urgent alert */}
        {nextUrgent && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: getVaccineStatus(nextUrgent.next_date) === 'expired' ? Colors.errorBg : Colors.cream,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: getVaccineStatus(nextUrgent.next_date) === 'expired' ? Colors.errorBorder : Colors.earth[200],
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
            accessibilityRole="alert"
          >
            <Ionicons
              name={getVaccineStatus(nextUrgent.next_date) === 'expired' ? 'alert-circle' : 'time'}
              size={22}
              color={getVaccineStatus(nextUrgent.next_date) === 'expired' ? Colors.error : Colors.earth[500]}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.forest[800] }}>
                {getVaccineStatus(nextUrgent.next_date) === 'expired' ? 'Vaccin expiré' : 'Rappel à prévoir'}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>
                {nextUrgent.title} · {nextUrgent.next_date ? new Date(nextUrgent.next_date).toLocaleDateString('fr-FR') : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          <Chip label="Tous" count={vaccines.length} active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="À jour" count={counts.ok} active={filter === 'ok'} onPress={() => setFilter('ok')} />
          <Chip label="Bientôt" count={counts.soon} active={filter === 'soon'} onPress={() => setFilter('soon')} />
          <Chip label="Expirés" count={counts.expired} active={filter === 'expired'} onPress={() => setFilter('expired')} />
        </ScrollView>

        {/* Vaccine list */}
        <View style={{ paddingHorizontal: 16 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="shield-checkmark-outline" size={56} color={Colors.forest[200]} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.forest[800], marginTop: 16, textAlign: 'center' }}>
                {filter === 'all' ? 'Aucun vaccin enregistré' : `Aucun vaccin "${filter === 'ok' ? 'à jour' : filter === 'soon' ? 'bientôt' : 'expiré'}"`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  onPress={() => { setEditing(null); setModalVisible(true); }}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter un vaccin"
                  style={{ marginTop: 16, backgroundColor: Colors.forest[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: Colors.cream, fontWeight: '600', fontSize: 15 }}>Ajouter un vaccin</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map((v) => (
              <VaccineCard
                key={v.id}
                vaccine={v}
                onPress={(vaccine) => { setEditing(vaccine); setModalVisible(true); }}
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
        accessibilityLabel="Ajouter un vaccin"
        style={{
          position: 'absolute',
          bottom: Math.max(24, insets.bottom + 8),
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.forest[500],
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: Colors.forest[500],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color={Colors.cream} />
      </TouchableOpacity>

      <VaccineFormModal
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
