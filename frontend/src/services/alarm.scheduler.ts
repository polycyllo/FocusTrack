import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Alarm, DayMap } from "../types/alarms";
import { dayLetterToWeekday } from "../utils/time";
import { DAY_LABEL, DAYS } from "../utils/time";

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

async function scheduleOne(
  alarm: Alarm,
  opts: {
    weekday?: number;
    hour: number;
    minute: number;
    text: string;
    repeats?: boolean;
  }
) {
  const androidChannelId = alarm.tone === "bell" ? "alarm-bell" : "default";

  const iosSound: Notifications.NotificationContentInput["sound"] =
    Platform.OS === "ios"
      ? alarm.tone === "bell"
        ? "bell"
        : "default"
      : undefined;

  const trigger: any = opts.weekday
    ? {
        weekday: opts.weekday,
        hour: opts.hour,
        minute: opts.minute,
        repeats: true,
        channelId: Platform.OS === "android" ? androidChannelId : undefined,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: (() => {
          const now = new Date();
          const when = new Date(now);
          when.setHours(opts.hour, opts.minute, 0, 0);
          if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
          return when;
        })(),
        channelId: Platform.OS === "android" ? androidChannelId : undefined,
      };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.title || "Alarma",
      body: buildBody(alarm, opts.text),
      data: { alarmId: alarm.id, type: alarm.type, time: opts.text },
      sound: iosSound ?? "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });
}

export async function scheduleAlarm(alarm: Alarm) {
  if (!alarm.active) return;

  if (alarm.repeatType === "daily") {
    const base = alarm.time ?? alarm.times?.[0];
    if (!base) return;
    const { hour, minute, text } = parseHHmm(base);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.title || "Alarma",
        body: buildBody(alarm, text),
        data: { alarmId: alarm.id, type: alarm.type, time: text },
        sound:
          Platform.OS === "ios"
            ? alarm.tone === "bell"
              ? "bell"
              : "default"
            : "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger:
        Platform.OS === "android"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: alarm.tone === "bell" ? "alarm-bell" : "default",
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
            },
    });
    return;
  }

  if (alarm.repeatType === "once" && alarm.date) {
    const { hour, minute, text } = parseHHmm(alarm.time ?? "08:00");
    const [y, m, d] = alarm.date.split("-").map(Number);
    const when = new Date(y, (m ?? 1) - 1, d, hour, minute, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.title || "Alarma",
        body: buildBody(alarm, text),
        data: { alarmId: alarm.id, type: alarm.type, time: text },
        sound:
          Platform.OS === "ios"
            ? alarm.tone === "bell"
              ? "bell"
              : "default"
            : "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger:
        Platform.OS === "android"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
              channelId: alarm.tone === "bell" ? "alarm-bell" : "default",
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
            },
    });
    return;
  }

  if (alarm.repeatType === "custom") {
    if (alarm.customByDay && Object.keys(alarm.customByDay).length) {
      const map = alarm.customByDay as DayMap;
      for (const letter of Object.keys(map)) {
        const weekday = dayLetterToWeekday(letter);
        for (const t of map[letter]) {
          const { hour, minute, text } = parseHHmm(t);
          await scheduleOne(alarm, {
            weekday,
            hour,
            minute,
            text,
            repeats: true,
          });
        }
      }
      return;
    }

    if (alarm.repeatDays?.length && alarm.times?.length) {
      for (const letter of alarm.repeatDays) {
        const weekday = dayLetterToWeekday(letter);
        for (const t of alarm.times) {
          const { hour, minute, text } = parseHHmm(t);
          await scheduleOne(alarm, {
            weekday,
            hour,
            minute,
            text,
            repeats: true,
          });
        }
      }
      return;
    }

    const base = alarm.time ?? alarm.times?.[0];
    if (base) {
      const { hour, minute, text } = parseHHmm(base);
      await scheduleOne(alarm, { hour, minute, text });
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
    content: {
      title,
      body,
      data: { alarmId: alarm.id, action },
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: null,
  });
}
