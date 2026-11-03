import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const CONFIG_KEY = 'aimprove.supabase.config';

let activeSupabaseClient: SupabaseClient | null = null;
let activeUrl = ENV_URL;
let activeAnonKey = ENV_KEY;

export function isValidSupabaseConfig(url: string, key: string): boolean {
  return (
    Boolean(url && key) &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    key.length > 20
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (activeSupabaseClient) return activeSupabaseClient;
  if (isValidSupabaseConfig(activeUrl, activeAnonKey)) {
    activeSupabaseClient = createClient(activeUrl, activeAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return activeSupabaseClient;
  }
  return null;
}

export function configureRuntimeSupabase(url: string, anonKey: string): SupabaseClient | null {
  activeUrl = url.trim();
  activeAnonKey = anonKey.trim();
  activeSupabaseClient = null;
  const client = getSupabaseClient();
  if (client) {
    AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ url: activeUrl, anonKey: activeAnonKey })).catch(() => {});
  }
  return client;
}

/** Restore a connection entered in the app on an earlier run (.env wins). */
export async function loadSavedSupabaseConfig(): Promise<void> {
  if (isValidSupabaseConfig(ENV_URL, ENV_KEY)) return;
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (isValidSupabaseConfig(saved.url, saved.anonKey)) {
      activeUrl = saved.url;
      activeAnonKey = saved.anonKey;
      activeSupabaseClient = null;
    }
  } catch {
    // ignore unreadable config
  }
}

export function getCurrentSupabaseConfig() {
  return {
    url: activeUrl,
    anonKey: activeAnonKey,
    isConfigured: isValidSupabaseConfig(activeUrl, activeAnonKey),
  };
}

