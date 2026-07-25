import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { SPIRITUALITY_MARKERS } from '@/types/models';
import { colors, spacing, radius } from '@/theme/colors';

// Condensed single-screen onboarding for the prototype. Sprint 1 splits this
// into a stepper (demographics → photos → faith → Life Verse → voice intro).
export default function ProfileSetup() {
  const { session, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    display_name: '', age: '', occupation: '', location_label: '',
    church_affiliation: '', congregation: '', bio: '', marriage_intentions: '', life_verse: ''
  });
  const [markers, setMarkers] = useState<string[]>([]);
  const [voiceRecorded, setVoiceRecorded] = useState(false); // expo-av wired in Sprint 1
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleMarker(m: string) {
    setMarkers((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function save() {
    if (!form.display_name || !form.life_verse || !form.bio || !form.age) {
      return Alert.alert('Incomplete', 'Name, age, bio and Life Verse are required.');
    }
    if (!voiceRecorded) {
      return Alert.alert('Voice intro required', 'A 15-second voice intro is needed to complete your profile.');
    }
    setBusy(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session?.user.id,
      account_type: 'match',
      display_name: form.display_name,
      age: parseInt(form.age, 10) || null,
      occupation: form.occupation,
      location_label: form.location_label,
      church_affiliation: form.church_affiliation,
      congregation: form.congregation,
      bio: form.bio,
      marriage_intentions: form.marriage_intentions,
      life_verse: form.life_verse,
      spirituality_markers: markers,
      voice_intro_url: 'placeholder://voice-intro' // replaced by real Storage URL in Sprint 1
    });
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    await refreshProfile(); // profile_complete flips true → root layout routes to Discover
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.h1}>Build your profile</Text>
        <Text style={styles.sub}>Your Life Verse is the first thing others see.</Text>

        <Field label="Display name" value={form.display_name} onChange={(v) => set('display_name', v)} />
        <Field label="Age" value={form.age} onChange={(v) => set('age', v)} keyboard="number-pad" />
        <Field label="Occupation" value={form.occupation} onChange={(v) => set('occupation', v)} />
        <Field label="Location" value={form.location_label} onChange={(v) => set('location_label', v)} />
        <Field label="Church affiliation" value={form.church_affiliation} onChange={(v) => set('church_affiliation', v)} />
        <Field label="Congregation" value={form.congregation} onChange={(v) => set('congregation', v)} />
        <Field label="Marriage intentions" value={form.marriage_intentions} onChange={(v) => set('marriage_intentions', v)} multiline />
        <Field label="Bio & values" value={form.bio} onChange={(v) => set('bio', v)} multiline />

        <Text style={styles.label}>Life Verse *</Text>
        <View style={styles.verseWrap}>
          <TextInput
            style={styles.verseInput} placeholder="e.g. Amos 3:3" placeholderTextColor={colors.muted}
            value={form.life_verse} onChangeText={(v) => set('life_verse', v)} multiline
          />
        </View>

        <Text style={styles.label}>Spirituality markers</Text>
        <View style={styles.chips}>
          {SPIRITUALITY_MARKERS.map((m) => (
            <Pressable key={m} onPress={() => toggleMarker(m)}
              style={[styles.chip, markers.includes(m) && styles.chipOn]}>
              <Text style={[styles.chipText, markers.includes(m) && styles.chipTextOn]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.voice, voiceRecorded && styles.voiceDone]} onPress={() => setVoiceRecorded(true)}>
          <Text style={styles.voiceText}>{voiceRecorded ? '✓ Voice intro recorded' : '● Record 15s voice intro'}</Text>
        </Pressable>

        <Pressable style={styles.save} onPress={save} disabled={busy}>
          <Text style={styles.saveText}>{busy ? 'Saving…' : 'Complete profile'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, multiline, keyboard }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboard?: 'default' | 'number-pad';
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} multiline={multiline} keyboardType={keyboard ?? 'default'}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  h1: { fontSize: 24, fontWeight: '800', color: colors.burgundy },
  sub: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { color: colors.ink, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.ink },
  verseWrap: { borderLeftWidth: 4, borderLeftColor: colors.sage, backgroundColor: '#F0F4F0', borderRadius: radius.md },
  verseInput: { padding: spacing.md, color: colors.ink, fontStyle: 'italic', minHeight: 60 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.sage, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipOn: { backgroundColor: colors.sage },
  chipText: { color: colors.sage, fontSize: 13 },
  chipTextOn: { color: colors.white },
  voice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.terracotta },
  voiceDone: { backgroundColor: '#F0F4F0', borderColor: colors.sage },
  voiceText: { color: colors.ink, fontWeight: '700' },
  save: { marginTop: spacing.xl, backgroundColor: colors.burgundy, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 16 }
});
