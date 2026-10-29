import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useLearningStore } from '../src/store/useLearningStore';

function RootNavigator() {
  const { colors, mode } = useTheme();
  const hydrate = useLearningStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bgSurface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.bgPrimary,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="japanese/review"
          options={{ title: 'Japanese SRS Review', presentation: 'card' }}
        />
        <Stack.Screen
          name="japanese/lessons"
          options={{ title: 'Japanese New Lessons', presentation: 'card' }}
        />
        <Stack.Screen
          name="japanese/reading"
          options={{ title: 'Reading & Sentence Mining', presentation: 'card' }}
        />
        <Stack.Screen
          name="quran/page/[pageNumber]"
          options={{ title: '15-Line Madani Mushaf', presentation: 'card' }}
        />
        <Stack.Screen
          name="quran/heatmap"
          options={{ title: '604-Page Mastery Heatmap', presentation: 'card' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
