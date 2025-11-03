import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Alarm, DayMap } from "../types/alarms";
import { dayLetterToWeekday } from "../utils/time";
import { DAY_LABEL, DAYS } from "../utils/time";

const ROLLING_WEEKS = 4;

async function scheduleExactAndroid(
  alarm: Alarm,
  date: Date,
  bodyText: string
) {
  if (Platform.OS !== "android") return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.title || "Alarma",
        body: bodyText,
        sound: alarm.tone === "bell" ? "bell" : "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        allowWhileIdle: true,
        channelId: alarm.tone === "bell" ? "alarm-bell" : "default",
      } as any,
    });
    return true;
  } catch (err) {
    console.warn("⚠️ scheduleExactAndroid fallback:", err);
    return false;
  }
}

function nextDateForWeekday(
  from: Date,
  targetWeekday1to7: number,
  hour: number,
  minute: number
) {
  const targetJS = targetWeekday1to7 === 7 ? 6 : targetWeekday1to7 - 1;
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const dayDiff = (targetJS - d.getDay() + 7) % 7;
  if (dayDiff === 0 && d <= from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + dayDiff);
  return d;
}

function nextNWeeklyDates(
  from: Date,
  targetWeekday1to7: number,
  hour: number,
  minute: number,
  nWeeks: number
) {
  const dates: Date[] = [];
  let first = nextDateForWeekday(from, targetWeekday1to7, hour, minute);
  for (let i = 0; i < nWeeks; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + 7 * i);
    dates.push(d);
  }
  return dates;
}

function buildBody(alarm: Alarm, timeText: string) {
  if (alarm.type === "subject") return `Clase / Materia a las ${timeText}.`;
  if (alarm.type === "task") return `Tarea pendiente a las ${timeText}.`;
  return `Recordatorio a las ${timeText}.`;
}

function parseHHmm(t: string): { hour: number; minute: number; text: string } {
  const [h, m] = t.split(":").map(Number);
  const text = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { hour: h, minute: m, text };
}

export async function scheduleAlarm(alarm: Alarm) {
  if (!alarm.active) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  // === Diario ===
  if (alarm.repeatType === "daily") {
    const base = alarm.time ?? alarm.times?.[0];
    if (!base) return;
    const { hour, minute, text } = parseHHmm(base);
    const when = new Date();
    when.setHours(hour, minute, 0, 0);
    if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);

    const bodyText = buildBody(alarm, text);

    if (Platform.OS === "android") {
      await scheduleExactAndroid(alarm, when, bodyText);
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.title || "Alarma",
          body: bodyText,
          data: { alarmId: alarm.id, type: alarm.type, time: text },
          sound:
            Platform.OS === "ios"
              ? alarm.tone === "bell"
                ? "bell"
                : "default"
              : "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    }
    return;
  }

  // === Única vez ===
  if (alarm.repeatType === "once" && alarm.date) {
    const { hour, minute, text } = parseHHmm(alarm.time ?? "08:00");
    const [y, m, d] = alarm.date.split("-").map(Number);
    const when = new Date(y, (m ?? 1) - 1, d, hour, minute, 0, 0);
    if (when.getTime() <= now.getTime()) return; // Ignorar fechas pasadas

    const bodyText = buildBody(alarm, text);
    if (Platform.OS === "android")
      await scheduleExactAndroid(alarm, when, bodyText);
    else
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.title || "Alarma",
          body: bodyText,
          data: { alarmId: alarm.id, type: alarm.type, time: text },
          sound:
            Platform.OS === "ios"
              ? alarm.tone === "bell"
                ? "bell"
                : "default"
              : "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    return;
  }

  // === Personalizada ===
  if (alarm.repeatType === "custom") {
    if (alarm.customByDay && Object.keys(alarm.customByDay).length) {
      for (const letter of Object.keys(alarm.customByDay)) {
        const weekday = dayLetterToWeekday(letter);
        for (const t of alarm.customByDay[letter]) {
          const { hour, minute, text } = parseHHmm(t);
          const dates = nextNWeeklyDates(
            now,
            weekday,
            hour,
            minute,
            ROLLING_WEEKS
          );
          const bodyText = buildBody(alarm, text);

          for (const date of dates) {
            if (date.getTime() <= now.getTime()) continue; // Ignorar pasadas
            if (Platform.OS === "android")
              await scheduleExactAndroid(alarm, date, bodyText);
            else
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: alarm.title || "Alarma",
                  body: bodyText,
                  data: { alarmId: alarm.id, type: alarm.type, time: text },
                  sound:
                    Platform.OS === "ios"
                      ? alarm.tone === "bell"
                        ? "bell"
                        : "default"
                      : "default",
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date,
                },
              });
          }
        }
      }
      return;
    }

    if (alarm.repeatDays?.length && alarm.times?.length) {
      for (const letter of alarm.repeatDays) {
        const weekday = dayLetterToWeekday(letter);
        for (const t of alarm.times) {
          const { hour, minute, text } = parseHHmm(t);
          const dates = nextNWeeklyDates(
            now,
            weekday,
            hour,
            minute,
            ROLLING_WEEKS
          );
          const bodyText = buildBody(alarm, text);

          for (const date of dates) {
            if (date.getTime() <= now.getTime()) continue; // Ignorar pasadas
            if (Platform.OS === "android")
              await scheduleExactAndroid(alarm, date, bodyText);
            else
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: alarm.title || "Alarma",
                  body: bodyText,
                  data: { alarmId: alarm.id, type: alarm.type, time: text },
                  sound:
                    Platform.OS === "ios"
                      ? alarm.tone === "bell"
                        ? "bell"
                        : "default"
                      : "default",
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date,
                },
              });
          }
        }
      }
      return;
    }

    const base = alarm.time ?? alarm.times?.[0];
    if (base) {
      const { hour, minute, text } = parseHHmm(base);
      const when = new Date();
      when.setHours(hour, minute, 0, 0);
      if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
      await scheduleExactAndroid(alarm, when, buildBody(alarm, text));
    }
  }
}

export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function describeRecurrence(alarm: Alarm): string {
  if (alarm.repeatType === "once") {
    const d = alarm.date ?? "";
    const t = alarm.time ?? alarm.times?.[0] ?? "";
    return `Única vez — ${d} a las ${t}`;
  }
  if (alarm.repeatType === "daily") {
    const t = alarm.time ?? alarm.times?.[0] ?? "";
    return `Diaria — ${t}`;
  }
  if (alarm.customByDay && Object.keys(alarm.customByDay).length) {
    const parts = Object.keys(alarm.customByDay)
      .filter((d) => DAYS.includes(d as any))
      .map((d) => {
        const hours = (alarm.customByDay![d] ?? []).join(", ");
        return `${DAY_LABEL[d]} (${hours})`;
      });
    return `Personalizada — ${parts.join("; ")}`;
  }
  if (alarm.repeatDays?.length && alarm.times?.length) {
    const ds = alarm.repeatDays
      .filter((d) => DAYS.includes(d as any))
      .map((d) => DAY_LABEL[d])
      .join("-");
    const hs = alarm.times.join(", ");
    return `Personalizada — ${ds} a ${hs}`;
  }
  const t = alarm.time ?? alarm.times?.[0] ?? "00:00";
  return `Personalizada — ${t}`;
}

type StatusAction =
  | "created"
  | "updated"
  | "activated"
  | "deactivated"
  | "removed";

export async function presentStatusNotification(
  action: StatusAction,
  alarm: Alarm
) {
  const rec = describeRecurrence(alarm);
  const mapTitle: Record<StatusAction, string> = {
    created: "✅ Alarma creada",
    updated: "✏️ Alarma actualizada",
    activated: "🔔 Alarma activada",
    deactivated: "🔕 Alarma desactivada",
    removed: "🗑️ Alarma eliminada",
  };
  const title = mapTitle[action] ?? "Alarma";
  const body =
    action === "removed" ? `${alarm.title}` : `${alarm.title} — ${rec}`;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: null,
  });
}
