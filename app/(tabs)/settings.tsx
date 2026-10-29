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
  const { colors, mode, setThemeMode } = useTheme();
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
      {/* Theme & Atmosphere Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Study Sanctuary Theme
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Switch between Warm Paper Light and Deep Ink Dark mode.
        </Text>

        <View style={styles.themeBtnRow}>
          <Pressable
            onPress={() => setThemeMode('light')}
            accessibilityRole="button"
            style={[
              styles.themeOptionBtn,
              {
                backgroundColor:
                  mode === 'light' ? colors.textPrimary : colors.bgMuted,
                borderColor:
                  mode === 'light' ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.themeOptionText,
                { color: mode === 'light' ? colors.bgPrimary : colors.textPrimary },
              ]}
            >
              Warm Paper (Light)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setThemeMode('dark')}
            accessibilityRole="button"
            style={[
              styles.themeOptionBtn,
              {
                backgroundColor:
                  mode === 'dark' ? colors.textPrimary : colors.bgMuted,
                borderColor:
                  mode === 'dark' ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.themeOptionText,
                { color: mode === 'dark' ? colors.bgPrimary : colors.textPrimary },
              ]}
            >
              Deep Ink (Dark)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Quran Sabqi Consolidation Window Config */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Quran Sabqi Consolidation Window
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Number of consecutive daily reviews a newly memorized Sabaq page completes before graduating to FSRS Manzil.
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
                      ? colors.quranSabqi
                      : colors.bgMuted,
                    borderColor: active ? colors.quranSabqi : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.windowPillText,
                    { color: active ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {days} Days
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
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Supabase Cloud Backend & Auth
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
              {currentSb.isConfigured ? 'CLOUD CONNECTED' : 'LOCAL FALLBACK ACTIVE'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          SQL schema is in supabase/migrations/001_initial_schema.sql. Enter your Supabase Project URL and Anon Key below (or in .env) to enable live PostgreSQL sync.
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
              backgroundColor: colors.bgMuted,
              borderColor: colors.borderStrong,
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
              backgroundColor: colors.bgMuted,
              borderColor: colors.borderStrong,
              color: colors.textPrimary,
            },
          ]}
        />

        <Pressable
          onPress={handleSaveSupabaseConfig}
          accessibilityRole="button"
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.jpVocab },
          ]}
        >
          <Text style={styles.primaryBtnText}>Save Supabase Connection</Text>
        </Pressable>

        {configFeedback ? (
          <Text style={[styles.feedbackNote, { color: colors.textPrimary }]}>
            {configFeedback}
          </Text>
        ) : null}

        {/* Personal Account Sign-In / Sign-Up */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.subHeading, { color: colors.textPrimary }]}>
          Personal Account (Supabase Auth + RLS)
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
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
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
                  backgroundColor: colors.bgMuted,
                  borderColor: colors.borderStrong,
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
                  backgroundColor: colors.bgMuted,
                  borderColor: colors.borderStrong,
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
                  { flex: 1, backgroundColor: colors.textPrimary },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: colors.bgPrimary }]}>
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
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.borderStrong,
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
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Session Review Log
          </Text>
          <Pressable
            onPress={() => state.resetDemoProgress()}
            accessibilityRole="button"
            style={[
              styles.resetBtn,
              { backgroundColor: colors.bgMuted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
              Reset Starter Queue
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
                  { backgroundColor: colors.bgMuted, borderColor: colors.border },
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
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    borderRadius: RADII.sm,
    borderWidth: 1,
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
    paddingHorizontal: 14,
    minHeight: 42,
    borderRadius: RADII.sm,
    borderWidth: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  input: {
    minHeight: 46,
    borderRadius: RADII.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  primaryBtn: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: RADII.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackNote: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  subHeading: {
    fontSize: 15,
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
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: RADII.sm,
    borderWidth: 1,
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
    padding: 10,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 8,
  },
  logLeft: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 12,
  },
  logDomainTag: {
    fontSize: 11,
    fontWeight: '800',
  },
});

