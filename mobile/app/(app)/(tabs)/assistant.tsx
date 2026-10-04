import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { usePets, useSelectedPet } from '@/hooks/usePets';
import { endpoints } from '@/services/api';
import type { ChatMessage } from '@/types/models';

const SUGGESTED_QUESTIONS = [
  'Ne zaman aşısı var?',
  'Son kilosu kaç?',
  'Bugün hangi ilaçları vermem gerekiyor?',
  'Geçen ay veterinere neden gitmiştik?',
  "Aşı geçmişini özetle.",
];

export default function AssistantScreen() {
  const { data: pets } = usePets();
  const { pet: activePet } = useSelectedPet();
  const scrollViewRef = useRef<ScrollView>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<ChatMessage & { used_tools?: string[]; provider?: string }>
  >([
    {
      role: 'assistant',
      content:
        `Hello! I'm your PetCare AI Assistant 🐾. Ask me about ${
          activePet ? activePet.name + "'s" : 'your pets’'
        } vaccination schedule, active medications, weight history, vet visits, or feeding routines.`,
    },
  ]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const updatedMessages: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];
      const res = (await endpoints.chat({
        messages: updatedMessages,
        pet_id: activePet?.id,
      })) as { reply?: string; message?: string; used_tools?: string[]; provider?: string };
      return { res, userMessage };
    },
    onSuccess: ({ res, userMessage }) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        {
          role: 'assistant',
          content: res.reply || res.message || 'No response received.',
          used_tools: res.used_tools,
          provider: res.provider,
        },
      ]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.message ||
            'I encountered an issue connecting to the pet database. Please verify the backend connection.',
        },
      ]);
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;
    setInput('');
    chatMutation.mutate(text);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.botIcon}>🤖</Text>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>AI Pet Assistant</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>READY</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Context: {activePet ? `🐾 ${activePet.name} (${activePet.species})` : 'All pets'}
            </Text>
          </View>
        </View>
      </View>

      {/* Medical Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ⚠️ Informational assistant only. Always consult a licensed veterinarian for urgent medical conditions.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={index}
                style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
                {!isUser && <Text style={styles.avatarMini}>🤖</Text>}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  {/* Tool usage pills */}
                  {msg.used_tools && msg.used_tools.length > 0 && (
                    <View style={styles.toolUsageRow}>
                      {msg.used_tools.map((t, idx) => (
                        <View key={idx} style={styles.toolBadge}>
                          <Text style={styles.toolBadgeText}>⚡ {t.replace(/_/g, ' ')}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAssistant]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {chatMutation.isPending && (
            <View style={[styles.msgRow, styles.msgRowAssistant]}>
              <Text style={styles.avatarMini}>🤖</Text>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.typingText}>Analyzing pet records...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested Quick Question Chips */}
        <View style={styles.quickChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChips}>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                disabled={chatMutation.isPending}
                onPress={() => handleSend(q)}>
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Ask about ${activePet?.name || 'your pet'}...`}
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || chatMutation.isPending) && styles.sendBtnDisabled]}
            disabled={!input.trim() || chatMutation.isPending}
            onPress={() => handleSend()}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIcon: {
    fontSize: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  disclaimerBanner: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#795548',
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },
  scroll: {
    padding: 16,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
    alignItems: 'flex-end',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    fontSize: 20,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toolUsageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  toolBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolBadgeText: {
    fontSize: 10,
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextUser: {
    color: '#fff',
  },
  msgTextAssistant: {
    color: theme.colors.text,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  quickChipsWrapper: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
  },
  quickChips: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
});
