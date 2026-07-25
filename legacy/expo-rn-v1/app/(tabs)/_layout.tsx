import { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.burgundy },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.burgundy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border }
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Conversations' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
