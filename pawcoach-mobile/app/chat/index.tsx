import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── Typing Indicator (3 dots animés) ────────────────────────────────────

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View
      className="bg-white rounded-xl rounded-bl-sm px-4 py-3 self-start mb-3 flex-row gap-1 items-center"
      style={{ shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}
      accessibilityLabel="PawCoach est en train d'écrire"
      accessibilityRole="progressbar"
    >
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          className="w-2 h-2 rounded-full bg-forest-400"
          style={{ opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}
        />
      ))}
    </View>
  );
}

// ─── Bubble ────────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View className={`mb-2 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-forest-500 rounded-br-sm'
            : 'bg-white rounded-bl-sm'
        }`}
        style={
          !isUser
            ? { shadowColor: '#2D5A3D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }
            : undefined
        }
        accessibilityLabel={`${isUser ? 'Vous' : 'PawCoach'} : ${message.content}`}
      >
        <Text className={`text-base leading-6 ${isUser ? 'text-cream' : 'text-forest-800'}`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000;
const COUNTER_THRESHOLD = 1800;

export default function ChatScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [dogId, setDogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const credits = profile?.messages_remaining ?? 0;
  const charCount = input.length;
  const canSend = input.trim().length > 0 && charCount <= MAX_CHARS && credits > 0 && !sending && !quotaExceeded;

  // ── Chargement initial ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        // Récupérer le premier chien
        const { data: dogs } = await supabase
          .from('dogs')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        const firstDogId = dogs?.[0]?.id ?? null;
        setDogId(firstDogId);

        if (!firstDogId) {
          setLoading(false);
          return;
        }

        // Charger l'historique
        const { data: history } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('dog_id', firstDogId)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50);

        setMessages((history as Message[]) ?? []);
      } catch (e) {
        console.warn('[Chat] init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // ── Envoyer un message ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!canSend || !user) return;

    const text = input.trim();
    setInput('');

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);
    setIsTyping(true);

    try {
      const conversationHistory = messages
        .filter((m) => !m.id.startsWith('opt-'))
        .slice(-20) // Max 20 messages pour le contexte
        .map(({ role, content }) => ({ role, content }));

      const { data, error: fnError } = await supabase.functions.invoke('pawcoach-chat', {
        body: {
          messages: [...conversationHistory, { role: 'user', content: text }],
          dogId,
        },
      });

      setIsTyping(false);

      if (fnError) {
        const status = (fnError as any)?.context?.status;
        if (status === 429 || (data as any)?.code === 'quota_exceeded') {
          setQuotaExceeded(true);
          // Retirer le message optimiste
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return;
        }
        throw fnError;
      }

      const assistantMsg: Message = {
        id: (data as any)?.id ?? `ast-${Date.now()}`,
        role: 'assistant',
        content: (data as any)?.response ?? '',
        created_at: new Date().toISOString(),
      };

      // Remplacer l'optimiste par le message sauvegardé + ajouter la réponse
      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === optimisticId
              ? { ...m, id: (data as any)?.userMessageId ?? m.id }
              : m
          )
          .concat(assistantMsg)
      );

      // Rafraîchir les crédits
      await refreshProfile();
    } catch (e) {
      console.warn('[Chat] send error:', e);
      setIsTyping(false);
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }, [canSend, input, messages, dogId, user, refreshProfile]);

  // ── Scroll auto vers le bas ─────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isTyping]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#2D5A3D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-earth-100 bg-cream">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 items-center justify-center -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color="#2D5A3D" />
        </TouchableOpacity>

        <View className="flex-1 ml-2">
          <Text className="text-base font-bold text-forest-800">Chat IA</Text>
          <Text className="text-xs text-forest-500">Votre coach personnel</Text>
        </View>

        {/* Crédits */}
        <View
          className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
            credits <= 5 ? 'bg-amber-50 border border-amber-200' : 'bg-forest-50 border border-forest-100'
          }`}
          accessibilityLabel={`${credits} crédits restants`}
        >
          <Ionicons
            name="chatbubble-outline"
            size={14}
            color={credits <= 5 ? '#C4A882' : '#2D5A3D'}
          />
          <Text
            className={`text-xs font-semibold ${credits <= 5 ? 'text-amber-700' : 'text-forest-600'}`}
          >
            {credits}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-full bg-forest-100 items-center justify-center mb-4">
                <Ionicons name="paw-outline" size={32} color="#2D5A3D" />
              </View>
              <Text className="text-base font-semibold text-forest-700 text-center mb-2">
                Bonjour ! Je suis PawCoach
              </Text>
              <Text className="text-sm text-forest-500 text-center leading-5">
                Posez-moi vos questions sur l'éducation, la santé ou le comportement de votre chien.
              </Text>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Quota dépassé */}
        {quotaExceeded ? (
          <View className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
            <Ionicons name="warning-outline" size={18} color="#C4A882" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-800">Crédits épuisés</Text>
              <Text className="text-xs text-amber-700 mt-0.5">
                Passez à Premium pour continuer à coacher votre chien
              </Text>
            </View>
          </View>
        ) : null}

        {/* Input Bar */}
        <SafeAreaView edges={['bottom']} className="bg-white border-t border-earth-100">
          <View className="flex-row items-end gap-2 px-4 py-3">
            <View className="flex-1 relative">
              <TextInput
                value={input}
                onChangeText={(t) => setInput(t.slice(0, MAX_CHARS))}
                placeholder={
                  quotaExceeded
                    ? 'Crédits épuisés…'
                    : credits === 0
                    ? 'Plus de crédits…'
                    : 'Écrivez votre message…'
                }
                placeholderTextColor="#C4A882"
                multiline
                editable={!quotaExceeded && credits > 0}
                maxLength={MAX_CHARS}
                returnKeyType="default"
                className="min-h-[44px] max-h-32 bg-earth-100 rounded-2xl px-4 py-3 text-base text-forest-800"
                accessibilityLabel="Champ de message"
                style={{ lineHeight: 20 }}
              />
              {/* Compteur de caractères visible à partir de 1800 */}
              {charCount >= COUNTER_THRESHOLD ? (
                <Text
                  className={`absolute right-3 bottom-2 text-xs ${
                    charCount >= MAX_CHARS ? 'text-error font-semibold' : 'text-forest-400'
                  }`}
                  accessibilityLabel={`${MAX_CHARS - charCount} caractères restants`}
                >
                  {MAX_CHARS - charCount}
                </Text>
              ) : null}
            </View>

            {/* Bouton Envoyer */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                canSend ? 'bg-forest-500' : 'bg-forest-200 opacity-50'
              }`}
              accessibilityRole="button"
              accessibilityLabel={sending ? 'Envoi en cours' : 'Envoyer le message'}
              accessibilityState={{ disabled: !canSend }}
              activeOpacity={0.82}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF8F0" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF8F0" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
