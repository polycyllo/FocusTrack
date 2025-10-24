import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Alarm } from "../types/alarms";

function buildBody(alarm: Alarm, timeText: string) {
  if (alarm.type === "subject") return `Clase / Materia a las ${timeText}.`;
  if (alarm.type === "task") return `Tarea pendiente a las ${timeText}.`;
  return `Recordatorio a las ${timeText}.`;
}

export async function scheduleAlarm(alarm: Alarm) {
  if (!alarm.active) return;

  const t = alarm.time ?? alarm.times?.[0];
  if (!t) return;

  const [hour, minute] = t.split(":").map(Number);
  const timeText = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}`;

  let trigger: Notifications.DailyTriggerInput | Notifications.DateTriggerInput;

  if (alarm.repeatType === "daily") {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
  } else if (alarm.repeatType === "once" && alarm.date) {
    const [y, m, d] = alarm.date.split("-").map(Number);
    const when = new Date(y, (m ?? 1) - 1, d, hour, minute, 0, 0);
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    };
  } else {
    const now = new Date();
    const when = new Date(now);
    when.setHours(hour, minute, 0, 0);
    if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    };
  }

  const androidChannelId = alarm.tone === "bell" ? "alarm-bell" : "default";

  const iosSound: Notifications.NotificationContentInput["sound"] =
    Platform.OS === "ios"
      ? alarm.tone === "bell"
        ? "bell"
        : "default"
      : undefined;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.title || "Alarma",
      body: buildBody(alarm, timeText),
      data: { alarmId: alarm.id, type: alarm.type, time: t },
      sound: iosSound ?? "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger:
      Platform.OS === "android"
        ? { ...trigger, channelId: androidChannelId as any }
        : trigger,
  });
}

export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
