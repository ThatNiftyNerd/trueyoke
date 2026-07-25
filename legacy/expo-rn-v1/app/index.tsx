import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

// Root redirect is handled in app/_layout.tsx based on auth + profile state.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.linen }}>
      <ActivityIndicator color={colors.burgundy} size="large" />
    </View>
  );
}
