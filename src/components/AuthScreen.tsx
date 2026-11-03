import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { CARD_EDGE, RADII } from '../theme/tokens';
import { useLearningStore } from '../store/useLearningStore';
import { getCurrentSupabaseConfig } from '../lib/supabase';
import { PressBlock, StampSeal } from './Stamp';

type Mode = 'sign-in' | 'sign-up';

function Field({
  label,
  secure,
  ...input
}: TextInputProps & { label: string; secure?: boolean }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          { borderColor: focused ? colors.indigo : colors.ink, backgroundColor: colors.bgSurface },
        ]}
      >
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure ? hidden : false}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: colors.ink }]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            style={styles.eye}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const signIn = useLearningStore((s) => s.signInWithSupabase);
  const connect = useLearningStore((s) => s.connectSupabaseRuntime);

  const [configured, setConfigured] = useState(getCurrentSupabaseConfig().isConfigured);
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const submit = async () => {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Your password needs at least 6 characters.');
    if (isSignUp && password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      const res = await signIn(cleanEmail, password, isSignUp);
      if (!res.ok) setError(res.message);
      else if (res.needsConfirmation) setNotice(res.message);
      // On success the root layout sees the session and opens Today.
    } catch (e: any) {
      setError(e?.message || "Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveConnection = async () => {
    setError(null);
    const res = await connect(sbUrl, sbKey);
    if (res.ok) setConfigured(true);
    else setError(res.message);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <StampSeal size={84} seed="aimprove" />
          <Text style={[styles.appName, { color: colors.ink }]} accessibilityRole="header">
            Aimprove
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            One daily card for your Japanese and your hafalan.
          </Text>
        </View>

        <View style={[styles.card, CARD_EDGE, { backgroundColor: colors.bgSurface }]}>
          {!configured ? (
            <>
              <Text style={[styles.title, { color: colors.ink }]}>Connect your project</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Accounts are stored in Supabase. Add the project URL and anon key here, or set them in .env and
                restart.
              </Text>
              <Field label="Project URL" value={sbUrl} onChangeText={setSbUrl} placeholder="https://xyz.supabase.co" keyboardType="url" />
              <Field label="Anon key" value={sbKey} onChangeText={setSbKey} placeholder="eyJ…" secure />
              {error ? <Message icon="alert-circle" text={error} /> : null}
              <PressBlock
                onPress={saveConnection}
                accessibilityRole="button"
                style={[styles.primary, { backgroundColor: colors.indigo }]}
              >
                <Text style={styles.primaryText}>Save connection</Text>
              </PressBlock>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.ink }]}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {isSignUp
                  ? 'Your streak and progress are saved to your account.'
                  : 'Sign in to pick up your streak where you left it.'}
              </Text>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                secure
                autoComplete={isSignUp ? 'new-password' : 'password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                returnKeyType={isSignUp ? 'next' : 'go'}
                onSubmitEditing={isSignUp ? undefined : submit}
              />
              {isSignUp ? (
                <Field
                  label="Confirm password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Type it again"
                  secure
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              ) : null}

              {error ? <Message icon="alert-circle" text={error} /> : null}
              {notice ? <Message icon="mail" text={notice} /> : null}

              <PressBlock
                onPress={submit}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ busy, disabled: busy }}
                style={[styles.primary, { backgroundColor: colors.indigo }]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
                )}
              </PressBlock>
            </>
          )}
        </View>

        {configured ? (
          <Pressable
            onPress={() => router.replace(isSignUp ? '/sign-in' : '/sign-up')}
            accessibilityRole="link"
            hitSlop={8}
            style={styles.switchRow}
          >
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              {isSignUp ? 'Already have an account? ' : 'New here? '}
              <Text style={{ color: colors.indigo, fontWeight: '900' }}>
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Text>
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Message({ icon, text }: { icon: 'alert-circle' | 'mail'; text: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.message, { borderColor: colors.ink, backgroundColor: colors.bgMuted }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Feather name={icon} size={18} color={colors.ink} />
      <Text style={[styles.messageText, { color: colors.ink }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16, width: '100%', maxWidth: 460, alignSelf: 'center', gap: 20 },
  brand: { alignItems: 'center', gap: 6 },
  appName: { fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 6 },
  tagline: { fontSize: 15, textAlign: 'center' },
  card: { borderRadius: RADII.sm, padding: 18, gap: 14 },
  title: { fontSize: 22, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20, marginTop: -6 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: RADII.sm },
  input: { flex: 1, minHeight: 50, paddingHorizontal: 14, fontSize: 16, outlineStyle: 'none' } as any,
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1.5, borderRadius: RADII.sm, padding: 12 },
  messageText: { flex: 1, fontSize: 14, lineHeight: 20 },
  primary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  switchRow: { alignItems: 'center', paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  switchText: { fontSize: 15 },
});
