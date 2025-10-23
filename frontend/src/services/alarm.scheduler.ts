import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Alarm } from "../types/alarms";

const BACKGROUND_TASK_NAME = "ALARM_BACKGROUND_TASK";
export async function scheduleAlarm(alarm: Alarm) {
  if (!alarm.time) return;

  const [hour, minute] = alarm.time.split(":").map(Number);

  let trigger: Notifications.DailyTriggerInput | Notifications.DateTriggerInput;

  if (alarm.repeatType === "daily") {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
  } else {
    const now = new Date();
    const fireDate = new Date(now);
    fireDate.setHours(hour, minute, 0, 0);

    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    };
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.title || "Alarma",
      body: "¡Es hora de tu tarea o clase!",
      sound: "bell.wav",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });
}

export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  console.log("🔄 Revisión background de alarmas");
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export async function registerBackgroundTask() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn("⛔️ BackgroundFetch no disponible en este dispositivo");
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("✅ BackgroundFetch registrado correctamente");
  } catch (error) {
    console.error("Error al registrar BackgroundFetch:", error);
  }
}
