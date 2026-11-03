import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useLearningStore } from '../src/store/useLearningStore';
import { applyGlobalFonts, useAppFonts, FONT_LATIN } from '../src/theme/fonts';

function RootNavigator() {
  const { colors } = useTheme();
  const hydrate = useLearningStore((s) => s.hydrate);
  const authReady = useLearningStore((s) => s.authReady);
  const userId = useLearningStore((s) => s.userId);
  const isRestoring = useLearningStore((s) => s.isRestoring);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // An account is required: signed-out users only see sign-in and sign-up.
  const onAuthScreen = segments[0] === 'sign-in' || segments[0] === 'sign-up';
  useEffect(() => {
    if (!authReady) return;
    if (!userId && !onAuthScreen) router.replace('/sign-in');
    else if (userId && onAuthScreen) router.replace('/');
  }, [authReady, userId, onAuthScreen, router]);

  // Hold a blank desk until we know where to go, so the app never flashes,
  // and while sign-in downloads saved progress, so the card opens complete.
  const holding =
    !authReady ||
    isRestoring ||
    (!userId && !onAuthScreen) ||
    (Boolean(userId) && onAuthScreen);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bgSurface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontFamily: FONT_LATIN['900'],
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          contentStyle: {
            backgroundColor: colors.bgPrimary,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="jp/review"
          options={{ title: 'Reviews', presentation: 'card' }}
        />
        <Stack.Screen
          name="jp/lessons"
          options={{ title: 'Lessons', presentation: 'card' }}
        />
        <Stack.Screen
          name="jp/reading"
          options={{ title: 'Reading', presentation: 'card' }}
        />
        <Stack.Screen
          name="mushaf/page/[pageNumber]"
          options={{ title: 'Mushaf', presentation: 'card' }}
        />
        <Stack.Screen
          name="mushaf/heatmap"
          options={{ title: 'Mushaf Map', presentation: 'card' }}
        />
        <Stack.Screen
          name="mushaf/makharij"
          options={{ title: 'Makhraj', presentation: 'card' }}
        />
        <Stack.Screen
          name="mushaf/numbers"
          options={{ title: 'Arabic numbers', presentation: 'card' }}
        />
      </Stack>
      {holding ? (
        <View style={[StyleSheet.absoluteFill, styles.hold, { backgroundColor: colors.bgPrimary }]}>
          <ActivityIndicator color={colors.indigo} />
        </View>
      ) : null}
    </>
  );
}

applyGlobalFonts();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  hold: { alignItems: 'center', justifyContent: 'center' },
});
