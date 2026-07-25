import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { Match, ACTIVE_CHAT_CAP } from '@/types/models';
import { colors, spacing, radius } from '@/theme/colors';

export default function Matches() {
  const { session } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<Match[]>([]);
  const [expired, setExpired] = useState<Match[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const uid = session?.user.id;
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`)
      .order('last_activity_at', { ascending: false });
    const all = (data as Match[]) ?? [];
    setActive(all.filter((m) => m.status === 'active'));
    setExpired(all.filter((m) => m.status === 'expired'));
  }

  return (
    <View style={styles.screen}>
      {/* Intentionality Circuit Breaker — active chat cap indicator (terracotta). */}
      <View style={styles.capBar}>
        <Text style={styles.capText}>
          {active.length} / {ACTIVE_CHAT_CAP} active conversations
        </Text>
        {active.length >= ACTIVE_CHAT_CAP && (
          <Text style={styles.capWarn}>Cap reached — close one to start a new match.</Text>
        )}
      </View>

      <FlatList
        data={active}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={<Text style={styles.section}>Active</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
            <Text style={styles.rowTitle}>Conversation</Text>
            <Text style={styles.rowMeta}>Last active {new Date(item.last_activity_at).toLocaleDateString()}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          expired.length ? (
            <View>
              <Text style={[styles.section, { color: colors.terracotta }]}>Expired (no activity in 72h)</Text>
              {expired.map((m) => (
                <View key={m.id} style={[styles.row, styles.rowExpired]}>
                  <Text style={[styles.rowTitle, { color: colors.muted }]}>Expired conversation</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet. Find a match in Discover.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen, padding: spacing.md },
  capBar: {
    backgroundColor: '#FBEEE6', borderColor: colors.terracotta, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md
  },
  capText: { color: colors.terracotta, fontWeight: '700' },
  capWarn: { color: colors.terracotta, marginTop: spacing.xs, fontSize: 12 },
  section: { fontSize: 13, fontWeight: '800', color: colors.burgundy, textTransform: 'uppercase', marginVertical: spacing.sm },
  row: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border
  },
  rowExpired: { opacity: 0.6 },
  rowTitle: { color: colors.ink, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl }
});
