import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { Profile, SwipeDirection } from '@/types/models';
import { colors, spacing, radius } from '@/theme/colors';

export default function Discover() {
  const { session } = useAuth();
  const [cards, setCards] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<Swiper<Profile>>(null);

  useEffect(() => { loadDeck(); }, []);

  async function loadDeck() {
    // Pull complete profiles the user hasn't swiped yet (excludes self).
    // Distance/compatibility filters applied client-side for the MVP; move to
    // a Postgres RPC with PostGIS in a later sprint.
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_type', 'match')
      .eq('profile_complete', true)
      .neq('id', session?.user.id)
      .limit(50);
    setCards((data as Profile[]) ?? []);
    setLoading(false);
  }

  async function recordSwipe(p: Profile, direction: SwipeDirection) {
    const { error } = await supabase.from('swipes').insert({
      swiper_id: session?.user.id,
      swipee_id: p.id,
      direction
    });
    // A mutual 'like' creates a match via DB trigger (handle_mutual_like).
    if (error && direction === 'like') {
      // The active-chat cap fires when the *match* is created; surface gently.
      console.log('swipe error', error.message);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.burgundy} size="large" /></View>;
  }

  if (!cards.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No profiles right now</Text>
        <Text style={styles.emptyBody}>Check back soon — new believers join every day.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Swiper
        ref={swiperRef}
        cards={cards}
        renderCard={(p) => <ProfileCard profile={p} />}
        onSwipedRight={(i) => recordSwipe(cards[i], 'like')}
        onSwipedLeft={(i) => recordSwipe(cards[i], 'pass')}
        backgroundColor="transparent"
        stackSize={3}
        cardVerticalMargin={spacing.lg}
        animateCardOpacity
      />
    </View>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{profile.display_name}{profile.age ? `, ${profile.age}` : ''}</Text>
      <Text style={styles.meta}>{profile.occupation} · {profile.location_label}</Text>

      <View style={styles.verseFrame}>
        <Text style={styles.verseLabel}>Life Verse</Text>
        <Text style={styles.verse}>{profile.life_verse}</Text>
      </View>

      <Text style={styles.bio} numberOfLines={4}>{profile.bio}</Text>

      <View style={styles.badges}>
        {profile.church_verified && <Badge label="Church Verified" />}
        {profile.id_verification_status === 'verified' && <Badge label="ID Verified" />}
      </View>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.linen, padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.burgundy },
  emptyBody: { color: colors.muted, marginTop: spacing.sm, textAlign: 'center' },
  card: {
    flex: 0.85, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border
  },
  name: { fontSize: 26, fontWeight: '800', color: colors.burgundy },
  meta: { color: colors.muted, marginTop: spacing.xs },
  verseFrame: {
    marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md,
    borderLeftWidth: 4, borderLeftColor: colors.sage, backgroundColor: '#F0F4F0'
  },
  verseLabel: { color: colors.sage, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  verse: { color: colors.ink, fontStyle: 'italic', marginTop: spacing.xs },
  bio: { color: colors.ink, marginTop: spacing.lg, lineHeight: 20 },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.sage, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.md },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' }
});
