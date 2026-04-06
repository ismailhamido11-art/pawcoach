import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Colors } from '../../../constants/theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const MOODS = [
  { emoji: '😊', label: 'Joyeux', value: 'happy' },
  { emoji: '😌', label: 'Calme', value: 'calm' },
  { emoji: '😴', label: 'Fatigué', value: 'tired' },
  { emoji: '😤', label: 'Agité', value: 'agitated' },
] as const;

type Mood = typeof MOODS[number]['value'];

const TAGS = ['Laisse', 'Sans laisse', 'Parc', 'Ville', 'Forêt', 'Pluie', 'Soleil', 'Câlins'];

// ─── Badge definitions (source of truth) ─────────────────────────────────────

interface BadgeDef {
  badge_id: string;
  name: string;
  emoji: string;
  category: 'walk' | 'streak' | 'training';
  condition: string;
}

const BADGE_DEFS: BadgeDef[] = [
  { badge_id: 'first_walk',     name: 'Première Balade',  emoji: '🐾', category: 'walk',   condition: '1 promenade enregistrée' },
  { badge_id: 'walker_10',      name: 'Marcheur',          emoji: '🚶', category: 'walk',   condition: '10 promenades enregistrées' },
  { badge_id: 'marathonien_50', name: 'Marathonien',       emoji: '🏃', category: 'walk',   condition: '50 promenades enregistrées' },
  { badge_id: 'streak_7',       name: 'Semaine Parfaite',  emoji: '🔥', category: 'streak', condition: 'Série de 7 jours consécutifs' },
  { badge_id: 'streak_30',      name: 'Mois d\'Or',        emoji: '🥇', category: 'streak', condition: 'Série de 30 jours consécutifs' },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LogWalkScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [dogId, setDogId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeDef | null>(null);

  // Load dog id on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from('dogs')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => setDogId(data?.id ?? null));
  }, [user]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // ── Update streak logic ───────────────────────────────────────────────────

  const updateStreak = useCallback(async (dId: string): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: streakRow } = await supabase
      .from('streaks')
      .select('current_streak, last_activity_date')
      .eq('dog_id', dId)
      .limit(1)
      .single();

    let newStreak = 1;
    if (streakRow) {
      const lastDate = streakRow.last_activity_date?.split('T')[0] ?? '';
      if (lastDate === todayStr) {
        newStreak = streakRow.current_streak; // already logged today
      } else if (lastDate === yesterdayStr) {
        newStreak = streakRow.current_streak + 1; // consecutive day
      }
      // else reset to 1 (gap > 1 day, grace day expired)
    }

    const { error } = await supabase
      .from('streaks')
      .upsert(
        { dog_id: dId, current_streak: newStreak, last_activity_date: todayStr },
        { onConflict: 'dog_id' }
      );
    if (error) throw error;
    return newStreak;
  }, []);

  // ── Check & unlock badges ─────────────────────────────────────────────────

  const checkBadges = useCallback(async (dId: string, totalLogs: number, currentStreak: number): Promise<BadgeDef | null> => {
    // Which badges should now be unlocked?
    const candidates: BadgeDef[] = [];
    if (totalLogs >= 1)  candidates.push(BADGE_DEFS[0]); // first_walk
    if (totalLogs >= 10) candidates.push(BADGE_DEFS[1]); // walker_10
    if (totalLogs >= 50) candidates.push(BADGE_DEFS[2]); // marathonien_50
    if (currentStreak >= 7)  candidates.push(BADGE_DEFS[3]); // streak_7
    if (currentStreak >= 30) candidates.push(BADGE_DEFS[4]); // streak_30

    if (candidates.length === 0) return null;

    // Already unlocked
    const { data: existing, error: badgeFetchErr } = await supabase
      .from('dog_achievements')
      .select('badge_id')
      .eq('dog_id', dId)
      .in('badge_id', candidates.map((b) => b.badge_id));
    if (badgeFetchErr) throw badgeFetchErr;

    const alreadyUnlocked = new Set((existing ?? []).map((r: { badge_id: string }) => r.badge_id));
    const newlyUnlocked = candidates.filter((b) => !alreadyUnlocked.has(b.badge_id));
    if (newlyUnlocked.length === 0) return null;

    // Insert new achievements
    const rows = newlyUnlocked.map((b) => ({
      dog_id: dId,
      badge_id: b.badge_id,
      name: b.name,
      emoji: b.emoji,
      category: b.category,
      unlocked_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('dog_achievements').insert(rows);
    if (error) console.warn('[LogWalk] checkBadges insert error:', error);

    // Return the "most impressive" newly unlocked badge (last one by index)
    return newlyUnlocked[newlyUnlocked.length - 1];
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!user || !dogId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Insert daily_log
      const distanceNum = distance.trim() ? parseFloat(distance.replace(',', '.')) : null;
      const { error: insertErr } = await supabase.from('daily_logs').insert({
        dog_id: dogId,
        walk_minutes: duration,
        walk_distance: distanceNum && !isNaN(distanceNum) ? distanceNum : null,
        walk_mood: mood,
        tags: selectedTags.length > 0 ? selectedTags : null,
        notes: notes.trim() || null,
      });
      if (insertErr) throw insertErr;

      // 2. Count total walk logs
      const { count: totalLogs, error: countErr } = await supabase
        .from('daily_logs')
        .select('id', { count: 'exact', head: true })
        .eq('dog_id', dogId)
        .gt('walk_minutes', 0);
      if (countErr) throw countErr;

      // 3. Update streak
      const newStreak = await updateStreak(dogId);

      // 4. Check badges
      const newBadge = await checkBadges(dogId, totalLogs ?? 0, newStreak);

      if (newBadge) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setUnlockedBadge(newBadge);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.back();
      }
    } catch (e) {
      setSubmitError("Impossible d'enregistrer la promenade. Réessayez.");
      console.warn('[LogWalk] handleSave error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [user, dogId, submitting, duration, distance, mood, selectedTags, notes, updateStreak, checkBadges, router]);

  const handleBadgeDismiss = useCallback(() => {
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Durée ─────────────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>DURÉE</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {DURATION_OPTIONS.map((d) => {
                const active = duration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDuration(d)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${d} minutes`}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Distance ──────────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>DISTANCE (optionnel)</Text>
            <TextInput
              value={distance}
              onChangeText={setDistance}
              placeholder="ex: 2.5"
              placeholderTextColor={Colors.earth[300]}
              keyboardType="decimal-pad"
              accessibilityLabel="Distance en kilomètres"
              style={styles.input}
            />
            <Text style={{ fontSize: 12, color: Colors.muted, marginTop: 4 }}>km</Text>

            {/* ── Humeur ────────────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>HUMEUR</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {MOODS.map((m) => {
                const active = mood === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    onPress={() => setMood(active ? null : m.value)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={m.label}
                    style={[styles.moodChip, active && styles.moodChipActive]}
                  >
                    <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 11, color: active ? Colors.forest[700] : Colors.muted, marginTop: 2 }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Tags ──────────────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TAGS</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={tag}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                  >
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Notes ─────────────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>NOTES (optionnel)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Comment s'est passée la promenade ?"
              placeholderTextColor={Colors.earth[300]}
              multiline
              numberOfLines={3}
              accessibilityLabel="Notes sur la promenade"
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            />

            {/* Error */}
            {submitError && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={15} color={Colors.error} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 }}>{submitError}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Save CTA — floating ──────────────────────────────────────── */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.cream,
            borderTopWidth: 1,
            borderTopColor: Colors.earth[100],
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={submitting || !dogId}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'Enregistrement en cours' : 'Enregistrer la promenade'}
            accessibilityState={{ disabled: submitting || !dogId }}
            style={[
              styles.saveBtn,
              (submitting || !dogId) && { opacity: 0.5 },
            ]}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color={Colors.cream} />
                <Text style={styles.saveBtnText}>Enregistrement…</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.cream} />
                <Text style={styles.saveBtnText}>Enregistrer la promenade</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Badge celebration modal ─────────────────────────────────────── */}
      <Modal
        visible={unlockedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={handleBadgeDismiss}
        accessibilityViewIsModal
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={handleBadgeDismiss}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            activeOpacity={1}
          />
          <View style={styles.celebrationCard}>
            {/* Confetti emoji header */}
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>

            {/* Badge icon */}
            <View style={styles.badgeIconWrapper}>
              <Text style={{ fontSize: 44 }}>{unlockedBadge?.emoji}</Text>
            </View>

            {/* Labels */}
            <Text style={styles.celebrationTitle}>Badge débloqué !</Text>
            <Text style={styles.celebrationBadgeName}>{unlockedBadge?.name}</Text>
            <Text style={styles.celebrationCondition}>{unlockedBadge?.condition}</Text>

            {/* Dismiss */}
            <TouchableOpacity
              onPress={handleBadgeDismiss}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Super, continuer"
              style={styles.celebrationBtn}
            >
              <Text style={styles.celebrationBtnText}>Super !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.forest[800],
    minHeight: 52,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.forest[500],
    borderColor: Colors.forest[500],
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.forest[700],
  },
  chipTextActive: {
    color: Colors.cream,
  },
  moodChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.earth[200],
    minHeight: 72,
    justifyContent: 'center',
  },
  moodChipActive: {
    backgroundColor: Colors.forest[50],
    borderColor: Colors.forest[400],
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.earth[200],
    minHeight: 44,
    justifyContent: 'center',
  },
  tagChipActive: {
    backgroundColor: Colors.forest[50],
    borderColor: Colors.forest[400],
  },
  tagChipText: {
    fontSize: 13,
    color: Colors.forest[700],
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: Colors.forest[600],
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: Colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  saveBtn: {
    backgroundColor: Colors.forest[500],
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
  },
  saveBtnText: {
    color: Colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  badgeIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.forest[800],
    marginBottom: 8,
  },
  celebrationBadgeName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.forest[500],
    marginBottom: 4,
  },
  celebrationCondition: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  celebrationBtn: {
    backgroundColor: Colors.forest[500],
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBtnText: {
    color: Colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
});
