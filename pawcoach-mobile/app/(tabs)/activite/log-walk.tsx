import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATIONS = [15, 30, 45, 60, 90] as const;

const MOODS = [
  { key: 'sad',     emoji: '😔', label: 'Fatigué' },
  { key: 'neutral', emoji: '😐', label: 'Neutre' },
  { key: 'happy',   emoji: '😊', label: 'Content' },
  { key: 'excited', emoji: '🤩', label: 'Euphorique' },
] as const;

const WALK_TAGS = ['parc', 'forêt', 'ville', 'plage', 'montagne', 'campagne'] as const;

// ─── Badge definitions ─────────────────────────────────────────────────────────

interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  category: 'walk' | 'streak';
  check: (totalWalks: number, streak: number) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'premiere_balade', name: 'Première Balade',   emoji: '🐾', category: 'walk',   check: (w) => w === 1 },
  { id: 'marcheur',        name: 'Marcheur',           emoji: '🚶', category: 'walk',   check: (w) => w === 10 },
  { id: 'marathonien',     name: 'Marathonien',        emoji: '🏃', category: 'walk',   check: (w) => w === 50 },
  { id: 'semaine_parfaite',name: 'Semaine Parfaite',   emoji: '🌟', category: 'streak', check: (_, s) => s >= 7 },
  { id: 'mois_or',         name: 'Mois d\'Or',         emoji: '🥇', category: 'streak', check: (_, s) => s >= 30 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnlockedBadge {
  name: string;
  emoji: string;
}

// ─── Badge Celebration Modal ──────────────────────────────────────────────────

function BadgeCelebrationModal({
  badge,
  onClose,
}: {
  badge: UnlockedBadge | null;
  onClose: () => void;
}) {
  if (!badge) return null;
  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
        <View style={styles.celebrationSheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>{badge.emoji}</Text>
          <Text style={styles.celebrationTitle}>Badge débloqué !</Text>
          <Text style={styles.celebrationName}>{badge.name}</Text>
          <Text style={styles.celebrationSub}>
            Bravo ! Continuez sur cette lancée.
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continuer"
            style={styles.celebrationCta}
          >
            <Text style={styles.celebrationCtaLabel}>Super !</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LogWalkScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState('');
  const [mood, setMood] = useState<string>('happy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<UnlockedBadge | null>(null);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Load dog
      const { data: dogData, error: dogErr } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      if (dogErr) throw dogErr;
      const dogId = dogData.id as string;

      const today = new Date().toISOString().split('T')[0];
      const parsedDistance = distance.trim() ? parseFloat(distance.replace(',', '.')) : null;
      const distanceKm = parsedDistance !== null && !isNaN(parsedDistance) ? parsedDistance : null;

      // 2. INSERT daily_log
      const { error: logErr } = await supabase.from('daily_logs').insert({
        dog_id: dogId,
        logged_date: today,
        walk_minutes: duration,
        walk_distance_km: distanceKm,
        walk_mood: mood,
        walk_tags: selectedTags.length > 0 ? selectedTags : null,
        notes: notes.trim() || null,
        user_id: user.id,
      });
      if (logErr) throw logErr;

      // 3. Update streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('id, current_streak, longest_streak, last_activity_date')
        .eq('dog_id', dogId)
        .maybeSingle();

      let newStreak = 1;
      if (streakData) {
        const lastDate = streakData.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastDate === yesterdayStr) {
          newStreak = (streakData.current_streak ?? 0) + 1;
        } else if (lastDate === today) {
          newStreak = streakData.current_streak ?? 1;
        }

        const { error: streakErr } = await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streakData.longest_streak ?? 0),
            last_activity_date: today,
          })
          .eq('id', streakData.id);
        if (streakErr) throw streakErr;
      } else {
        const { error: streakInsErr } = await supabase
          .from('streaks')
          .insert({ dog_id: dogId, current_streak: 1, longest_streak: 1, last_activity_date: today, user_id: user.id });
        if (streakInsErr) throw streakInsErr;
      }

      // 4. Count total walks for badge check
      const { count: totalWalks } = await supabase
        .from('daily_logs')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dogId)
        .gt('walk_minutes', 0);

      // 5. Fetch already unlocked badges to avoid re-inserting
      const { data: existingBadges } = await supabase
        .from('dog_achievements')
        .select('badge_id')
        .eq('dog_id', dogId);
      const unlockedIds = new Set((existingBadges ?? []).map((b: any) => b.badge_id));

      // 6. Check each badge
      let newBadge: UnlockedBadge | null = null;
      for (const def of BADGE_DEFS) {
        if (unlockedIds.has(def.id)) continue;
        if (def.check(totalWalks ?? 0, newStreak)) {
          const { error: badgeErr } = await supabase.from('dog_achievements').insert({
            dog_id: dogId,
            badge_id: def.id,
            badge_name: def.name,
            badge_emoji: def.emoji,
            category: def.category,
          });
          if (!badgeErr) {
            newBadge = { name: def.name, emoji: def.emoji };
            break; // One badge per walk
          }
        }
      }

      // 7. Haptic + celebration or navigate back
      if (newBadge) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setUnlockedBadge(newBadge);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (e) {
      setSubmitError('Impossible d\'enregistrer la promenade. Réessayez.');
      console.warn('[LogWalkScreen] error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [user, submitting, duration, distance, mood, selectedTags, notes, router]);

  const handleBadgeClose = useCallback(() => {
    setUnlockedBadge(null);
    router.back();
  }, [router]);

  return (
    <>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.cream }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Durée */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>Durée</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {DURATIONS.map((d) => {
                  const active = d === duration;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDuration(d)}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${d} minutes`}
                      style={[styles.durationChip, active && styles.durationChipActive]}
                    >
                      <Text style={[styles.durationChipLabel, active && styles.durationChipLabelActive]}>
                        {d} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Distance */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>Distance <Text style={{ color: Colors.muted, fontWeight: '400' }}>(optionnel)</Text></Text>
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="0.0"
                  placeholderTextColor={Colors.earth[300]}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Distance en kilomètres"
                  style={styles.input}
                  editable={!submitting}
                />
                <Text style={{ fontSize: 15, color: Colors.muted, fontWeight: '500' }}>km</Text>
              </View>
            </View>

            {/* Humeur */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>Humeur du chien</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                {MOODS.map((m) => {
                  const active = m.key === mood;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setMood(m.key)}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={m.label}
                      style={[styles.moodChip, active && styles.moodChipActive]}
                    >
                      <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tags */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>Lieu <Text style={{ color: Colors.muted, fontWeight: '400' }}>(optionnel)</Text></Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {WALK_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.75}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={tag}
                      style={[styles.tag, active && styles.tagActive]}
                    >
                      <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>Notes <Text style={{ color: Colors.muted, fontWeight: '400' }}>(optionnel)</Text></Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Comment s'est passée la promenade ?"
                placeholderTextColor={Colors.earth[300]}
                multiline
                numberOfLines={3}
                accessibilityLabel="Notes sur la promenade"
                editable={!submitting}
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12, marginTop: 10 }]}
              />
            </View>

            {/* Error */}
            {submitError && (
              <View
                style={styles.errorBox}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle-outline" size={15} color={Colors.error} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>
                  {submitError}
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'Enregistrement en cours' : 'Enregistrer la promenade'}
            accessibilityState={{ disabled: submitting }}
            style={[styles.ctaBtn, submitting && { opacity: 0.6 }]}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color={Colors.cream} />
                <Text style={styles.ctaBtnLabel}>Enregistrement…</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.cream} />
                <Text style={styles.ctaBtnLabel}>Enregistrer la promenade</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Badge celebration modal */}
      <BadgeCelebrationModal badge={unlockedBadge} onClose={handleBadgeClose} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.forest[800],
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.forest[800],
    minHeight: 52,
  },
  // Duration chips
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  durationChipActive: {
    borderColor: Colors.forest[500],
    backgroundColor: Colors.forest[500],
  },
  durationChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  durationChipLabelActive: {
    color: Colors.cream,
  },
  // Mood chips
  moodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    backgroundColor: Colors.white,
    gap: 4,
    minHeight: 72,
    justifyContent: 'center',
  },
  moodChipActive: {
    borderColor: Colors.forest[400],
    backgroundColor: Colors.forest[50],
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
  },
  moodLabelActive: {
    color: Colors.forest[600],
  },
  // Tags
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    backgroundColor: Colors.white,
    minHeight: 36,
    justifyContent: 'center',
  },
  tagActive: {
    borderColor: Colors.forest[400],
    backgroundColor: Colors.forest[50],
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.muted,
  },
  tagLabelActive: {
    color: Colors.forest[600],
    fontWeight: '600',
  },
  // Error
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.earth[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  ctaBtn: {
    backgroundColor: Colors.forest[500],
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
  },
  ctaBtnLabel: {
    color: Colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  // Celebration modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  celebrationSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.earth[200],
    borderRadius: 2,
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.forest[800],
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrationName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.forest[500],
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrationSub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  celebrationCta: {
    backgroundColor: Colors.forest[500],
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  celebrationCtaLabel: {
    color: Colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
});
