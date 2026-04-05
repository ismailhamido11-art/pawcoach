import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import PremiumGate from '../../../components/health/PremiumGate';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'léger' | 'modéré' | 'sévère';

interface SymptomCategory {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  symptoms: string[];
}

// ─── Symptom categories ───────────────────────────────────────────────────────

const CATEGORIES: SymptomCategory[] = [
  {
    key: 'digestif',
    label: 'Digestif',
    icon: 'nutrition',
    symptoms: ['Vomissements', 'Diarrhée', 'Perte d\'appétit', 'Ballonnements', 'Constipation'],
  },
  {
    key: 'respiratoire',
    label: 'Respiratoire',
    icon: 'pulse',
    symptoms: ['Toux', 'Essoufflement', 'Éternuements', 'Écoulements nasaux', 'Respiration sifflante'],
  },
  {
    key: 'locomoteur',
    label: 'Locomoteur',
    icon: 'walk',
    symptoms: ['Boiterie', 'Raideur', 'Douleur à la mobilité', 'Gonflement articulaire', 'Faiblesse musculaire'],
  },
  {
    key: 'cutané',
    label: 'Cutané',
    icon: 'hand-left',
    symptoms: ['Démangeaisons', 'Plaies', 'Chute de poils', 'Rougeurs', 'Croûtes'],
  },
  {
    key: 'comportemental',
    label: 'Comportemental',
    icon: 'alert',
    symptoms: ['Léthargie', 'Agressivité', 'Désorientation', 'Anxiété excessive', 'Changements d\'humeur'],
  },
  {
    key: 'autre',
    label: 'Autre',
    icon: 'ellipsis-horizontal',
    symptoms: ['Fièvre', 'Prise/perte de poids rapide', 'Yeux rouges', 'Problèmes urinaires', 'Saignements'],
  },
];

const SEVERITY_OPTIONS: { key: Severity; label: string; color: string; bg: string; border: string }[] = [
  { key: 'léger',  label: 'Léger',  color: '#2D5A3D', bg: '#EEF4F0', border: '#ADD1B5' },
  { key: 'modéré', label: 'Modéré', color: '#7A5230', bg: '#FFF8F0', border: '#E4D0BB' },
  { key: 'sévère', label: 'Sévère', color: '#C0392B', bg: '#FFF5F5', border: '#FCA5A5' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DiagnosticScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // ── Gate check state ────────────────────────────────────────────────────────
  const [gateLoading, setGateLoading] = useState(true);
  const [actionsRemaining, setActionsRemaining] = useState<number | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<SymptomCategory | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>('léger');
  const [startDate, setStartDate] = useState(todayISO());
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dogId, setDogId] = useState<string | null>(null);

  // ── Check quota & load dog ─────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      if (!user) return;
      // Load dog
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      setDogId(dogs?.[0]?.id ?? null);

      // Check quota
      if (profile?.is_premium) {
        setActionsRemaining(999);
        setGateLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('actions_remaining')
          .eq('id', user.id)
          .single();
        setActionsRemaining(data?.actions_remaining ?? 0);
      } catch {
        setActionsRemaining(0);
      } finally {
        setGateLoading(false);
      }
    }
    init();
  }, [user, profile]);

  // ── Symptom toggle ──────────────────────────────────────────────────────────
  function toggleSymptom(sym: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
  }

  function selectCategory(cat: SymptomCategory) {
    setCategory(cat);
    setSelectedSymptoms([]);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const canSubmit = category !== null && selectedSymptoms.length > 0 && startDate.trim().length >= 8;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    if (!dogId) {
      Alert.alert('Aucun chien', 'Ajoutez votre chien depuis l\'accueil pour utiliser le diagnostic.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('pawcoach-diagnostic', {
        body: {
          dogId,
          symptoms: selectedSymptoms,
          symptomCategory: category!.key,
          severity,
          startDate,
          additionalInfo: additionalInfo.trim() || undefined,
        },
      });
      if (error) throw error;
      if (!data?.success || !data?.report) throw new Error('Réponse invalide du serveur.');

      router.push({
        pathname: '/(tabs)/sante/diagnostic-result',
        params: { report: JSON.stringify(data.report) },
      });
    } catch (e: any) {
      const status = (e as any)?.context?.status;
      if (status === 429 || (e as any)?.message?.includes('quota')) {
        Alert.alert(
          'Quota atteint',
          'Vos diagnostics gratuits du jour sont épuisés. Passez Premium pour un accès illimité.',
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'analyser. Vérifiez votre connexion et réessayez.');
      }
      console.warn('[Diagnostic] submit error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, dogId, category, selectedSymptoms, severity, startDate, additionalInfo, router]);

  // ── Gate loading ────────────────────────────────────────────────────────────
  if (gateLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2D5A3D" />
      </SafeAreaView>
    );
  }

  // ── Premium gate ────────────────────────────────────────────────────────────
  if (!profile?.is_premium && actionsRemaining === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        <PremiumGate
          title="Diagnostic IA Premium"
          subtitle="Vos diagnostics gratuits du jour sont épuisés. Passez Premium pour analyser la santé de votre chien sans limite."
        />
      </SafeAreaView>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Disclaimer */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: '#FFF8F0',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E4D0BB',
              padding: 16,
              flexDirection: 'row',
              gap: 12,
            }}
            accessibilityRole="alert"
          >
            <Ionicons name="warning-outline" size={20} color="#7A5230" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, color: '#7A5230', lineHeight: 18 }}>
              <Text style={{ fontWeight: '700' }}>Avertissement médical : </Text>
              PawDoc IA fournit une orientation préliminaire, pas un diagnostic vétérinaire. Consultez toujours un vétérinaire pour tout problème de santé.
            </Text>
          </View>

          {/* PawDoc branding */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#EEF4F0',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#2D5A3D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name="medkit" size={26} color="#2D5A3D" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#132A1C' }}>PawDoc IA</Text>
            <Text style={{ fontSize: 13, color: '#687068', marginTop: 4 }}>
              Décrivez les symptômes de votre chien
            </Text>
            {!profile?.is_premium && actionsRemaining !== null && actionsRemaining < 999 && actionsRemaining > 0 && (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: '#EEF4F0',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: '#2D5A3D', fontWeight: '600' }}>
                  {actionsRemaining} diagnostic{actionsRemaining !== 1 ? 's' : ''} gratuit{actionsRemaining !== 1 ? 's' : ''} restant{actionsRemaining !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* 1. Category */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={sectionLabel}>1. CATÉGORIE DE SYMPTÔMES</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {CATEGORIES.map((cat) => {
                const active = category?.key === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => selectCategory(cat)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Catégorie : ${cat.label}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 20,
                      minHeight: 40,
                      backgroundColor: active ? '#2D5A3D' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: active ? '#2D5A3D' : '#E4D0BB',
                    }}
                  >
                    <Ionicons name={cat.icon} size={14} color={active ? '#FFF8F0' : '#687068'} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFF8F0' : '#687068' }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Symptoms */}
          {category && (
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <Text style={sectionLabel}>2. SYMPTÔMES OBSERVÉS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {category.symptoms.map((sym) => {
                  const active = selectedSymptoms.includes(sym);
                  return (
                    <TouchableOpacity
                      key={sym}
                      onPress={() => toggleSymptom(sym)}
                      activeOpacity={0.75}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={sym}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        minHeight: 36,
                        backgroundColor: active ? '#EEF4F0' : '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: active ? '#2D5A3D' : '#E4D0BB',
                      }}
                    >
                      {active && <Ionicons name="checkmark" size={12} color="#2D5A3D" />}
                      <Text style={{ fontSize: 13, color: active ? '#2D5A3D' : '#687068', fontWeight: active ? '600' : '400' }}>
                        {sym}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* 3. Severity */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={sectionLabel}>3. INTENSITÉ</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setSeverity(opt.key)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Intensité ${opt.label}`}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: active ? opt.bg : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: active ? opt.color : '#E4D0BB',
                      minHeight: 44,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: active ? opt.color : '#687068' }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Start date */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={sectionLabel}>4. DÉBUT DES SYMPTÔMES</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#C4A882"
              style={fieldInput}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Date de début des symptômes au format AAAA-MM-JJ"
            />
          </View>

          {/* 5. Additional info */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={sectionLabel}>5. INFORMATIONS COMPLÉMENTAIRES</Text>
            <TextInput
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="Décrivez en détail : comportement, durée, contexte..."
              placeholderTextColor="#C4A882"
              style={[fieldInput, { height: 100, textAlignVertical: 'top' }]}
              multiline
              accessibilityLabel="Informations complémentaires sur les symptômes"
            />
          </View>

          {/* Submit */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={submitting ? 'Analyse en cours' : 'Analyser avec PawDoc IA'}
              accessibilityState={{ disabled: !canSubmit || submitting }}
              style={{
                backgroundColor: '#2D5A3D',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                minHeight: 52,
                opacity: !canSubmit || submitting ? 0.5 : 1,
              }}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFF8F0" />
                  <Text style={{ color: '#FFF8F0', fontSize: 16, fontWeight: '700' }}>
                    Analyse en cours…
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#FFF8F0" />
                  <Text style={{ color: '#FFF8F0', fontSize: 16, fontWeight: '700' }}>
                    Analyser avec PawDoc IA
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

const fieldInput = {
  marginTop: 8,
  backgroundColor: '#F5F1EB',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#E4D0BB',
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15 as const,
  color: '#132A1C',
  minHeight: 48,
};
