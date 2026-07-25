import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/store/auth';
import { colors, spacing, radius } from '@/theme/colors';

export default function ProfileTab() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.name}>{profile.display_name}{profile.age ? `, ${profile.age}` : ''}</Text>
      <Text style={styles.meta}>{profile.occupation} · {profile.location_label}</Text>

      <View style={styles.verseFrame}>
        <Text style={styles.verseLabel}>Life Verse</Text>
        <Text style={styles.verse}>{profile.life_verse}</Text>
      </View>

      <Text style={styles.label}>Church</Text>
      <Text style={styles.value}>{profile.church_affiliation} — {profile.congregation}</Text>

      <Text style={styles.label}>Verification</Text>
      <Text style={styles.value}>
        ID: {profile.id_verification_status} · Church: {profile.church_verified ? 'verified' : 'pending'}
      </Text>

      <Pressable style={styles.signout} onPress={signOut}>
        <Text style={styles.signoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  name: { fontSize: 26, fontWeight: '800', color: colors.burgundy },
  meta: { color: colors.muted, marginTop: spacing.xs },
  verseFrame: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.sage, backgroundColor: '#F0F4F0' },
  verseLabel: { color: colors.sage, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  verse: { color: colors.ink, fontStyle: 'italic', marginTop: spacing.xs },
  label: { color: colors.burgundy, fontWeight: '700', marginTop: spacing.lg },
  value: { color: colors.ink, marginTop: spacing.xs },
  signout: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  signoutText: { color: colors.danger, fontWeight: '700' }
});
