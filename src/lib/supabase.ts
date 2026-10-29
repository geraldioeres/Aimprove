import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

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
  return getSupabaseClient();
}

export function getCurrentSupabaseConfig() {
  return {
    url: activeUrl,
    anonKey: activeAnonKey,
    isConfigured: isValidSupabaseConfig(activeUrl, activeAnonKey),
  };
}

