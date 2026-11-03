import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  selectDueJapaneseReviews,
  selectDueQuranPages,
  useLearningStore,
} from '../../src/store/useLearningStore';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useLearningStore();
  const dueJP = selectDueJapaneseReviews(state).totalCount;
  const dueQuran = selectDueQuranPages(state).totalDue;
  const totalDue = dueJP + dueQuran;

  // Respect Android 3-button / gesture navigation bar, iOS Home Indicator, and mobile web safe area
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 12);
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.bgSurface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        } as any,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.bgSurface,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarBadge: totalDue > 0 ? totalDue : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.jpRadical,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
            borderRadius: 3,
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
            backgroundColor: colors.jpRadical,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
            borderRadius: 3,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="language-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran',
          tabBarBadge: dueQuran > 0 ? dueQuran : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.quranSabaq,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
            borderRadius: 3,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
