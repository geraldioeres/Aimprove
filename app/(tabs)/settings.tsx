import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import { useLearningStore } from '../../src/store/useLearningStore';
import { getCurrentSupabaseConfig } from '../../src/lib/supabase';

export default function SettingsAndCloudScreen() {
  const { colors } = useTheme();
  const state = useLearningStore();

  const currentSb = getCurrentSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSb.url);
  const [supabaseKey, setSupabaseKey] = useState(currentSb.anonKey);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authFeedback, setAuthFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleSaveSupabaseConfig = async () => {
    const res = await state.connectSupabaseRuntime(supabaseUrl, supabaseKey);
    setConfigFeedback(res.message);
  };

  const handleAuth = async (isSignUp: boolean) => {
    if (!email.trim() || !password.trim()) {
      setAuthFeedback({
        ok: false,
        message: 'Enter both your email address and password.',
      });
      return;
    }
    const res = await state.signInWithSupabase(
      email.trim(),
      password.trim(),
      isSignUp
    );
    setAuthFeedback(res);
  };

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

      {/* Supabase Cloud Connection & Personal Account Auth */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.ink },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Cloud sync
          </Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: currentSb.isConfigured
                  ? colors.successBg
                  : colors.warningBg,
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color: currentSb.isConfigured
                    ? colors.success
                    : colors.warning,
                },
              ]}
            >
              {currentSb.isConfigured ? 'Connected' : 'Saved on this device only'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Enter your Supabase project URL and anon key (or set them in .env). The schema is in supabase/migrations.
        </Text>

        <TextInput
          value={supabaseUrl}
          onChangeText={setSupabaseUrl}
          placeholder="https://your-project-id.supabase.co"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.ink,
              color: colors.textPrimary,
            },
          ]}
        />

        <TextInput
          value={supabaseKey}
          onChangeText={setSupabaseKey}
          placeholder="Supabase Anon Public Key"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.ink,
              color: colors.textPrimary,
            },
          ]}
        />

        <Pressable
          onPress={handleSaveSupabaseConfig}
          accessibilityRole="button"
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.indigo },
          ]}
        >
          <Text style={styles.primaryBtnText}>Save connection</Text>
        </Pressable>

        {configFeedback ? (
          <Text style={[styles.feedbackNote, { color: colors.textPrimary }]}>
            {configFeedback}
          </Text>
        ) : null}

        {/* Personal Account Sign-In / Sign-Up */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.subHeading, { color: colors.textPrimary }]}>
          Account
        </Text>

        {state.userEmail ? (
          <View style={styles.signedInBox}>
            <Text style={[styles.signedInText, { color: colors.success }]}>
              Signed in as: {state.userEmail}
            </Text>
            <Pressable
              onPress={() => state.signOutSupabase()}
              accessibilityRole="button"
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.bgSurface, borderColor: colors.ink },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                Sign Out
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.authForm}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.ink,
                  color: colors.textPrimary,
                },
              ]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.ink,
                  color: colors.textPrimary,
                },
              ]}
            />
            <View style={styles.authBtnRow}>
              <Pressable
                onPress={() => handleAuth(false)}
                accessibilityRole="button"
                style={[
                  styles.primaryBtn,
                  { flex: 1, backgroundColor: colors.indigo },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleAuth(true)}
                accessibilityRole="button"
                style={[
                  styles.secondaryBtn,
                  {
                    flex: 1,
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.ink,
                  },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                  Create Account
                </Text>
              </Pressable>
            </View>
            {authFeedback ? (
              <Text
                style={[
                  styles.feedbackNote,
                  { color: authFeedback.ok ? colors.success : colors.danger },
                ]}
              >
                {authFeedback.message}
              </Text>
            ) : null}
          </View>
        )}
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
            onPress={() => state.resetDemoProgress()}
            accessibilityRole="button"
            style={[
              styles.resetBtn,
              { backgroundColor: colors.bgSurface, borderColor: colors.ink },
            ]}
          >
            <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
              Reset starter data
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

