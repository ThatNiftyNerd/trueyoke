import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/store/auth';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const { session, profile, loading, init } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (session && !profile?.profile_complete && segments[0] !== '(onboarding)') {
      router.replace('/(onboarding)/profile-setup');
    } else if (session && profile?.profile_complete && inAuth) {
      router.replace('/(tabs)/discover');
    }
  }, [session, profile, loading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.linen }}>
      <StatusBar style="light" backgroundColor={colors.burgundy} />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
