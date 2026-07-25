import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/theme/colors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password.');
    setBusy(true);
    const fn = mode === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await fn({ email, password });
    setBusy(false);
    if (error) Alert.alert('Auth error', error.message);
    // On success, root layout routes to account-type / onboarding.
  }

  // Google OAuth: configure provider in Supabase, then call
  // supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'yoked://' } })
  // Wired in Sprint 1 once the OAuth client IDs exist.

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brand}>
        <Text style={styles.logo}>YOKED</Text>
        <Text style={styles.tag}>Equally yoked. Intentionally matched.</Text>
      </View>

      <TextInput
        style={styles.input} placeholder="Email" placeholderTextColor={colors.muted}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
      />
      <TextInput
        style={styles.input} placeholder="Password" placeholderTextColor={colors.muted}
        secureTextEntry value={password} onChangeText={setPassword}
      />

      <Pressable style={styles.primary} onPress={submit} disabled={busy}>
        <Text style={styles.primaryText}>{mode === 'signup' ? 'Create account' : 'Sign in'}</Text>
      </Pressable>

      <Pressable style={styles.google} onPress={() => Alert.alert('Google', 'Configure OAuth in Sprint 1.')}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
        <Text style={styles.switch}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen, padding: spacing.lg, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 40, fontWeight: '800', color: colors.burgundy, letterSpacing: 2 },
  tag: { color: colors.muted, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, color: colors.ink
  },
  primary: { backgroundColor: colors.burgundy, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  google: {
    marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white
  },
  googleText: { color: colors.ink, fontWeight: '600' },
  switch: { textAlign: 'center', color: colors.burgundy, marginTop: spacing.lg }
});
