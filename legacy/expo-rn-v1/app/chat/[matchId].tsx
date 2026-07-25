import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { Message } from '@/types/models';
import { colors, spacing, radius } from '@/theme/colors';

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    loadHistory();
    // Realtime subscription — replaces the PRD's Socket.IO with Supabase Realtime.
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  async function loadHistory() {
    const { data } = await supabase
      .from('messages').select('*').eq('match_id', matchId).order('created_at');
    setMessages((data as Message[]) ?? []);
  }

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText('');
    await supabase.from('messages').insert({
      match_id: matchId, sender_id: session?.user.id, body
    });
    // last_activity_at is bumped by the touch_match_activity trigger.
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        <Text style={styles.title}>Conversation</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender_id === session?.user.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={mine ? styles.mineText : styles.theirsText}>{item.body}</Text>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input} placeholder="Write with intention…" placeholderTextColor={colors.muted}
            value={text} onChangeText={setText} multiline
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  header: {
    backgroundColor: colors.burgundy, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: spacing.md
  },
  back: { color: colors.white, fontSize: 16 },
  title: { color: colors.white, fontWeight: '700', fontSize: 16 },
  bubble: { maxWidth: '78%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.burgundy },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  mineText: { color: colors.white },
  theirsText: { color: colors.ink },
  composer: {
    flexDirection: 'row', padding: spacing.sm, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.linen
  },
  input: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, color: colors.ink, maxHeight: 120
  },
  sendBtn: { backgroundColor: colors.burgundy, borderRadius: radius.md, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  sendText: { color: colors.white, fontWeight: '700' }
});
