import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import NutritionPaywall from '../../../components/nutrition/NutritionPaywall';
import { Colors } from '../../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type DangerCategory = 'safe' | 'caution' | 'toxic';

interface HistoryItem {
  id: string;
  food_name: string;
  danger_category: DangerCategory;
  toxicity_score: number;
  created_at: string;
}

// ─── Danger badge config ──────────────────────────────────────────────────────

const DANGER_COLORS: Record<DangerCategory, { color: string; bg: string; label: string }> = {
  safe:    { color: '#10B981', bg: '#F0FDF4', label: 'Sans danger' },
  caution: { color: '#F59E0B', bg: '#FFFBEB', label: 'Attention' },
  toxic:   { color: '#EF4444', bg: '#FEF2F2', label: 'Toxique' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, rounded = 8 }: { w?: DimensionValue; h: number; rounded?: number }) {
  return (
    <View style={{ width: w ?? '100%', height: h, borderRadius: rounded, backgroundColor: Colors.skeleton }} />
  );
}

// ─── History item row ─────────────────────────────────────────────────────────

function HistoryRow({ item }: { item: HistoryItem }) {
  const cfg = DANGER_COLORS[item.danger_category] ?? DANGER_COLORS.caution;
  const date = new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        minHeight: 52,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: cfg.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={
            item.danger_category === 'safe'
              ? 'checkmark-circle'
              : item.danger_category === 'caution'
              ? 'warning'
              : 'alert-circle'
          }
          size={18}
          color={cfg.color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.forest[800] }} numberOfLines={1}>
          {item.food_name}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 2 }}>{date}</Text>
      </View>
      <View
        style={{
          backgroundColor: cfg.bg,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [inputText, setInputText] = useState('');
  const [dogId, setDogId] = useState<string | null>(null);
  const [actionsRemaining, setActionsRemaining] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // ── Init: load dog + quota + history ────────────────────────────────────────
  const loadInit = useCallback(async () => {
    if (!user) return;
    try {
      const [dogRes, profileRes, historyRes] = await Promise.all([
        supabase.from('dogs').select('id').eq('owner_id', user.id).order('created_at', { ascending: true }).limit(1),
        profile?.is_premium
          ? Promise.resolve({ data: null })
          : supabase.from('profiles').select('actions_remaining').eq('id', user.id).single(),
        supabase
          .from('food_scans')
          .select('id, food_name, danger_category, toxicity_score, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setDogId(dogRes.data?.[0]?.id ?? null);
      setActionsRemaining(profile?.is_premium ? 999 : ((profileRes.data as any)?.actions_remaining ?? 3));
      setHistory((historyRes.data as HistoryItem[]) ?? []);
    } catch (e) {
      console.warn('[ScanScreen] init error:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user, profile]);

  useEffect(() => { loadInit(); }, [loadInit]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const food = inputText.trim();
    if (!food || submitting) return;

    setSubmitting(true);
    const startTime = Date.now();

    try {
      const invokePromise = supabase.functions.invoke('food-scan', {
        body: { foodName: food, dogId: dogId ?? undefined },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      // Minimum 2s visual delay
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));

      if (error) throw error;
      if (!data?.success || !data?.scan) throw new Error('Réponse invalide du serveur.');

      router.push({
        pathname: '/(tabs)/nutrition/scan-result' as any,
        params: { scan: JSON.stringify(data.scan) },
      });
    } catch (e: any) {
      // Minimum 2s even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));

      const status = (e as any)?.context?.status;
      const msg = (e as any)?.message ?? '';
      if (status === 429 || msg.includes('quota') || msg.includes('exceeded')) {
        setShowPaywall(true);
      } else if (msg === 'timeout') {
        // inline error handled below via state — no Alert
        console.warn('[ScanScreen] timeout');
      } else {
        console.warn('[ScanScreen] submit error:', e);
      }
    } finally {
      setSubmitting(false);
    }
  }, [inputText, submitting, dogId, router]);

  const canSubmit = inputText.trim().length >= 2 && !submitting;
  const isPremium = profile?.is_premium ?? false;
  const quotaDisplay = isPremium
    ? null
    : actionsRemaining !== null
    ? `${Math.max(0, actionsRemaining)}/3 analyses utilisées aujourd'hui`
    : null;

  return (
    <>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Icon branding */}
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Colors.forest[50],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  shadowColor: Colors.forest[500],
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Ionicons name="search" size={26} color={Colors.forest[500]} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.forest[800] }}>
                Scan Alimentaire
              </Text>
              <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
                Vérifiez si un aliment est sans danger pour votre chien
              </Text>
            </View>

            {/* Input */}
            <View style={{ paddingHorizontal: 16 }}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Tapez le nom de l'aliment (ex: raisin, chocolat…)"
                placeholderTextColor={Colors.earth[300]}
                returnKeyType="search"
                onSubmitEditing={canSubmit ? handleAnalyze : undefined}
                editable={!submitting}
                accessibilityLabel="Nom de l'aliment à analyser"
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: Colors.earth[200],
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: Colors.forest[800],
                  minHeight: 52,
                }}
              />
            </View>

            {/* Analyze button */}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleAnalyze}
                disabled={!canSubmit}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={submitting ? 'Analyse en cours' : 'Analyser l\'aliment'}
                accessibilityState={{ disabled: !canSubmit }}
                style={{
                  backgroundColor: Colors.forest[500],
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 52,
                  opacity: !canSubmit ? 0.5 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.cream} />
                    <Text style={{ color: Colors.cream, fontSize: 16, fontWeight: '700' }}>
                      Analyse en cours…
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color={Colors.cream} />
                    <Text style={{ color: Colors.cream, fontSize: 16, fontWeight: '700' }}>
                      Analyser
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                backgroundColor: Colors.cream,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: Colors.earth[200],
                padding: 12,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'flex-start',
              }}
              accessibilityRole="none"
            >
              <Ionicons name="warning-outline" size={15} color={Colors.earth[400]} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: Colors.muted, lineHeight: 17 }}>
                Ce scanner est indicatif. Consultez toujours un vétérinaire en cas de doute ou d'urgence.
              </Text>
            </View>

            {/* Recent history */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 12 }}>
                HISTORIQUE RÉCENT
              </Text>

              {historyLoading ? (
                <View style={{ gap: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Skeleton w={36} h={36} rounded={18} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Skeleton h={14} w="60%" />
                        <Skeleton h={11} w="30%" />
                      </View>
                    </View>
                  ))}
                </View>
              ) : history.length === 0 ? (
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: 28,
                    backgroundColor: Colors.white,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="time-outline" size={28} color={Colors.forest[200]} />
                  <Text style={{ fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 }}>
                    Aucun scan effectué.{'\n'}Commencez en tapant un aliment ci-dessus.
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    shadowColor: Colors.forest[500],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {history.map((item, i) => (
                    <View key={item.id}>
                      <HistoryRow item={item} />
                      {i < history.length - 1 && (
                        <View style={{ height: 1, backgroundColor: Colors.earth[100] }} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Quota bar — floating bottom */}
      {quotaDisplay && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.earth[100],
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
          accessibilityLabel={quotaDisplay}
        >
          <Ionicons name="analytics-outline" size={16} color={Colors.forest[400]} />
          <Text style={{ fontSize: 13, color: Colors.muted, flex: 1 }}>{quotaDisplay}</Text>
          {actionsRemaining !== null && actionsRemaining <= 1 && (
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.earth[400] }}>
              Passez Premium →
            </Text>
          )}
        </View>
      )}

      {/* Paywall modal */}
      <NutritionPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        headline="Vous avez utilisé vos 3 analyses aujourd'hui"
      />
    </>
  );
}
