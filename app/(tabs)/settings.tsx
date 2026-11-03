import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { PressBlock } from '../../src/components/Stamp';
import { RADII, SPACING } from '../../src/theme/tokens';
import { useLearningStore } from '../../src/store/useLearningStore';
import { getCurrentSupabaseConfig } from '../../src/lib/supabase';

const ERASE_MESSAGE =
  'This deletes all your lessons, Quran pages and streak from this phone and your account. It cannot be undone.';

/** Ask before erasing; the cloud copy goes too, so there is no way back. */
function confirmErase(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`Erase all progress?

${ERASE_MESSAGE}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert('Erase all progress?', ERASE_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Erase', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function SettingsAndCloudScreen() {
  const { colors } = useTheme();
  const state = useLearningStore();

  const host = (() => {
    try {
      return new URL(getCurrentSupabaseConfig().url).host;
    } catch {
      return null;
    }
  })();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Daily goal: how many items earn today's stamp */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily goal</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Reviews, lessons and recitations you need each day to earn the day's stamp and keep your streak.
        </Text>
        <View style={styles.windowPillRow}>
          {[5, 10, 20, 40].map((goal) => {
            const active = state.dailyGoal === goal;
            return (
              <Pressable
                key={goal}
                onPress={() => state.setDailyGoal(goal)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.windowPill,
                  {
                    backgroundColor: active ? colors.indigo : colors.bgSurface,
                    borderColor: active ? colors.indigo : colors.ink,
                  },
                ]}
              >
                <Text style={[styles.windowPillText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>
                  {goal} a day
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sabqi revision window Config */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Sabqi revision window
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          How many days a new page stays in daily Sabqi revision before it moves to Manzil.
        </Text>

        <View style={styles.windowPillRow}>
          {[5, 7, 10, 14, 20].map((days) => {
            const active = state.sabqiWindowDays === days;
            return (
              <Pressable
                key={days}
                onPress={() => state.setSabqiWindowDays(days)}
                accessibilityRole="button"
                style={[
                  styles.windowPill,
                  {
                    backgroundColor: active
                      ? colors.indigo
                      : colors.bgSurface,
                    borderColor: active ? colors.indigo : colors.ink,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.windowPillText,
                    { color: active ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {days} days
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Account */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
        <Text style={[styles.signedInText, { color: colors.textPrimary }]}>
          Signed in as {state.userEmail ?? 'unknown'}
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Your progress saves on this phone and syncs to your account, so it comes back when you sign in on another phone{host ? ` (${host})` : ''}.
        </Text>
        <PressBlock
          onPress={() => state.signOutSupabase()}
          accessibilityRole="button"
          style={[styles.signOutBtn, { backgroundColor: colors.bgSurface }]}
        >
          <Feather name="log-out" size={18} color={colors.ink} />
          <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>Sign out</Text>
        </PressBlock>
      </View>

      {/* Recent Review Log Activity */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Review history
          </Text>
          <Pressable
            onPress={() => confirmErase(() => state.resetDemoProgress())}
            accessibilityRole="button"
            style={[
              styles.resetBtn,
              { backgroundColor: colors.bgSurface, borderColor: colors.ink },
            ]}
          >
            <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
              Erase all progress
            </Text>
          </Pressable>
        </View>

        {state.reviewLogs.length === 0 ? (
          <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
            No reviews logged in this session yet. Complete a Japanese review or Mushaf page recitation to see real-time SRS stage transitions here.
          </Text>
        ) : (
          <View style={styles.logList}>
            {state.reviewLogs.slice(0, 12).map((log) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  { backgroundColor: colors.bgSurface, borderColor: colors.ink },
                ]}
              >
                <View style={styles.logLeft}>
                  <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
                    {log.title}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                    {log.previousStage} {'->'} {log.newStage} • Mistakes: {log.mistakes}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.logDomainTag,
                    {
                      color:
                        log.domain === 'japanese'
                          ? colors.jpVocab
                          : colors.quranSabaq,
                    },
                  ]}
                >
                  {log.domain.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50 },
  container: { flex: 1 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADII.lg,
    borderWidth: 2,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  themeBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  themeOptionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADII.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  windowPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  windowPill: {
    paddingHorizontal: 16,
    minHeight: 42,
    borderRadius: RADII.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  windowPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: RADII.pill,
    borderWidth: 2,
    paddingHorizontal: 18,
    fontSize: 14,
  },
  primaryBtn: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: RADII.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackNote: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1.5,
    marginVertical: 8,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  signedInBox: {
    gap: 8,
  },
  signedInText: {
    fontSize: 14,
    fontWeight: '700',
  },
  authForm: {
    gap: 8,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  resetBtn: {
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: RADII.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyLogsText: {
    fontSize: 13,
    lineHeight: 19,
  },
  logList: {
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 2,
    gap: 8,
  },
  logLeft: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  logMeta: {
    fontSize: 12,
  },
  logDomainTag: {
    fontSize: 12,
    fontWeight: '700',
  },
});

