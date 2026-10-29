import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  selectDueJapaneseReviews,
  selectDueQuranPages,
  useLearningStore,
} from '../../src/store/useLearningStore';

export default function TabsLayout() {
  const { colors, mode, toggleTheme } = useTheme();
  const state = useLearningStore();
  const dueJP = selectDueJapaneseReviews(state).totalCount;
  const dueQuran = selectDueQuranPages(state).totalDue;
  const totalDue = dueJP + dueQuran;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgSurface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerRight: () => (
          <Pressable
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'light' ? 'Switch to Deep Ink Dark mode' : 'Switch to Warm Paper Light mode'
            }
            style={({ pressed }) => [
              styles.themeToggleBtn,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name={mode === 'light' ? 'moon-outline' : 'sunny-outline'}
              size={16}
              color={colors.textPrimary}
            />
            <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
              {mode === 'light' ? 'Dark' : 'Light'}
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Queue",
          tabBarBadge: totalDue > 0 ? totalDue : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.jpKanji,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="japanese"
        options={{
          title: 'Japanese',
          tabBarBadge: dueJP > 0 ? dueJP : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.jpVocab,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="language-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran Hafalan',
          tabBarBadge: dueQuran > 0 ? dueQuran : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.quranSabaq,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cloud & Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-done-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 14,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

