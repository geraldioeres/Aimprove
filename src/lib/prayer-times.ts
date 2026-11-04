import { Platform } from 'react-native';
import { CalculationParameters, Coordinates, Madhab, PrayerTimes } from 'adhan';
import * as Notifications from 'expo-notifications';

export type PrayerKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export const PRAYERS: { key: PrayerKey; name: string }[] = [
  { key: 'subuh', name: 'Subuh' },
  { key: 'dzuhur', name: 'Dzuhur' },
  { key: 'ashar', name: 'Ashar' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isya', name: 'Isya' },
];

export interface PrayerTime {
  key: PrayerKey;
  name: string;
  time: Date;
}

/**
 * Kemenag RI method: Subuh at 20° and Isya at 18° below the horizon, Shafi'i
 * Ashar, plus the customary 2-minute ihtiyat on every time.
 */
function kemenagParams(): CalculationParameters {
  const params = new CalculationParameters('Other', 20, 18);
  params.madhab = Madhab.Shafi;
  params.adjustments = { fajr: 2, sunrise: 0, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 };
  return params;
}

export function prayerTimesFor(lat: number, lng: number, date: Date = new Date()): PrayerTime[] {
  const t = new PrayerTimes(new Coordinates(lat, lng), date, kemenagParams());
  const at: Record<PrayerKey, Date> = {
    subuh: t.fajr,
    dzuhur: t.dhuhr,
    ashar: t.asr,
    maghrib: t.maghrib,
    isya: t.isha,
  };
  return PRAYERS.map((p) => ({ ...p, time: at[p.key] }));
}

export function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "in 42 min", "in 2 h 5 min". */
export function formatUntil(target: Date, now: Date = new Date()): string {
  const mins = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}

// ---------------------------------------------------------------------------
// Reminders: a local notification 10 minutes before each prayer.

const REMINDER_PREFIX = 'prayer-reminder-';
const LEAD_MINUTES = 10;
const DAYS_AHEAD = 3;
let handlerSet = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('prayer', {
    name: 'Prayer reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Ask for notification permission. On Android 13+ the system only shows the
 * prompt once the app has a notification channel, so create it first.
 * `canAskAgain` is false when the user has blocked notifications and only
 * the phone's settings can turn them back on.
 */
export async function enableReminderPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  if (Platform.OS === 'web') return { granted: false, canAskAgain: false };
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return { granted: true, canAskAgain: true };
    if (!current.canAskAgain) return { granted: false, canAskAgain: false };
    const asked = await Notifications.requestPermissionsAsync();
    return { granted: asked.granted, canAskAgain: asked.canAskAgain };
  } catch {
    return { granted: false, canAskAgain: true };
  }
}

/**
 * Replace this app's prayer reminders with fresh ones for the next few days.
 * Called on launch, after the location or setting changes, and after each
 * completed block, so the schedule never runs dry while the app is used.
 */
export async function scheduleReminders(
  lat: number | null,
  lng: number | null,
  enabled: boolean
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
    if (!enabled || lat == null || lng == null) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;

    if (!handlerSet) {
      handlerSet = true;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
      });
    }
    await ensureAndroidChannel();

    const now = Date.now();
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const day = new Date();
      day.setDate(day.getDate() + d);
      for (const p of prayerTimesFor(lat, lng, day)) {
        const fireAt = new Date(p.time.getTime() - LEAD_MINUTES * 60000);
        if (fireAt.getTime() <= now) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `${REMINDER_PREFIX}${fireAt.getTime()}`,
          content: {
            title: `${p.name} in ${LEAD_MINUTES} minutes`,
            body: 'Your next 3 ayah are ready. Memorise them before you pray.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
            channelId: 'prayer',
          },
        });
      }
    }
  } catch {
    // Reminders are a convenience; never block the app on them.
  }
}
