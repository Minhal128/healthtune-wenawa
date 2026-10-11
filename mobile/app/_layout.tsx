import { AppAuthProvider } from '@/features/auth';
import { queryClient } from '@/features/shared/api/query-client';
import setup from '@/utils/config/axios-interceptors';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-svg';
import { Toaster } from 'sonner-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontWaitExpired, setFontWaitExpired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFontWaitExpired(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = loaded || fontWaitExpired;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
    try {
      setup();
    } catch (e) {
      console.warn('axios setup failed', e);
    }
  }, [ready]);

  if (!ready) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <AppAuthProvider>
            <QueryClientProvider client={queryClient}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(primary)" options={{ headerShown: false }} />
              </Stack>
            </QueryClientProvider>
          </AppAuthProvider>
        </BottomSheetModalProvider>
        <Toaster />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
