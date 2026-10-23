import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic';
import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '@/components/ui';
import { StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, NotoNaskhArabic_400Regular });
  const { ready, progress } = useStore();
  const show = fontsLoaded && ready;

  useEffect(() => {
    if (show) SplashScreen.hideAsync().catch(() => {});
  }, [show]);

  if (!show) return null;
  const registered = !!progress;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!registered}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={registered}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[levelId]" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/[id]" />
          <Stack.Screen name="profile" />
        </Stack.Protected>
      </Stack>
      <Toast />
    </View>
  );
}
