import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alarm, AlarmInput, AlarmType } from "../types/alarms";
import { DAYS, compareTimeAsc } from "../utils/time";
import {
  scheduleAlarm,
  cancelAllAlarms,
  presentStatusNotification,
  describeRecurrence,
} from "../services/alarm.scheduler";

const KEY_LIST = "@app/alarms:list";
const KEY_LAST_TONE = "@app/alarms:lastTone";

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

function firstTimeOf(
  alarm: Alarm | (Alarm & { customByDay?: Record<string, string[]> })
) {
  if ((alarm as any).customByDay) {
    const map = (alarm as any).customByDay as Record<string, string[]>;
    const all = Object.values(map).flat();
    if (all.length > 0) {
      return all.sort(compareTimeAsc)[0];
    }
  }
  return alarm.time ?? alarm.times?.[0] ?? "00:00";
}

function orderedByActivesAndTime(alarms: Alarm[]) {
  return [...alarms].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    const ta = firstTimeOf(a as any);
    const tb = firstTimeOf(b as any);
    return compareTimeAsc(ta, tb);
  });
}

function validate(
  input: AlarmInput & { customByDay?: Record<string, string[]> | null }
) {
  if (!input.title?.trim()) throw new Error("El título es requerido.");
  if (!["subject", "task"].includes(input.type))
    throw new Error("Tipo inválido.");

  if (!["once", "daily", "custom"].includes(input.repeatType))
    throw new Error("Repetición inválida.");

  if (input.repeatType === "once") {
    if (!input.date) throw new Error("Fecha requerida para “una sola vez”.");
    if (!input.time) throw new Error("Hora requerida para “una sola vez”.");
  }

  if (input.repeatType === "daily") {
    if (!input.time) throw new Error("Hora requerida para “diaria”.");
  }

  if (input.repeatType === "custom") {
    const hasLegacy = !!(
      input.repeatDays &&
      input.repeatDays.length &&
      input.times &&
      input.times.length
    );
    const hasMap = !!(
      input.customByDay && Object.keys(input.customByDay).length
    );

    if (!hasLegacy && !hasMap) {
      throw new Error("Configura los días/horas para “personalizada”.");
    }

    if (hasLegacy) {
      const invalid = input.repeatDays!.some((d) => !DAYS.includes(d as any));
      if (invalid) throw new Error("Día inválido.");
    }

    if (hasMap) {
      for (const d of Object.keys(input.customByDay!)) {
        if (!DAYS.includes(d as any)) throw new Error(`Día inválido (${d}).`);
        const arr = input.customByDay![d];
        if (!arr || !arr.length)
          throw new Error(`Agrega al menos una hora para ${d}.`);
      }
    }
  }
}

type Ctx = {
  alarms: Alarm[];
  loading: boolean;
  error?: string;
  hydrated: boolean;
  lastTone?: string;

  bootstrap: () => Promise<void>;
  listByType: (type: AlarmType) => Alarm[];
  getById: (id: string) => Alarm | undefined;

  create: (
    input: AlarmInput & { customByDay?: Record<string, string[]> | null }
  ) => Promise<Alarm>;
  update: (
    id: string,
    patch: Partial<Alarm> & { customByDay?: Record<string, string[]> | null }
  ) => Promise<Alarm>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;

  setLastTone: (tone: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const AlarmStoreContext = createContext<Ctx | null>(null);

export const AlarmsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [lastTone, setLastToneState] = useState<string | undefined>(undefined);

  const persist = useCallback(async (list: Alarm[]) => {
    await AsyncStorage.setItem(KEY_LIST, JSON.stringify(list));
  }, []);

  const reseedAllActive = useCallback(async (list: Alarm[]) => {
    try {
      await cancelAllAlarms();
      const actives = list.filter((a) => a.active);
      await Promise.allSettled(actives.map((a) => scheduleAlarm(a)));
    } catch (e) {
      console.warn("reseedAllActive failed", e);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    if (hydrated) return;
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(KEY_LIST);
      const last = await AsyncStorage.getItem(KEY_LAST_TONE);

      let loadedList: Alarm[] = [];
      if (raw) {
        const parsed: Alarm[] = JSON.parse(raw);
        loadedList = orderedByActivesAndTime(parsed);
        setAlarms(loadedList);
      } else {
        const now = new Date();
        const base: (Alarm & { customByDay?: Record<string, string[]> })[] = [
          {
            id: uuid(),
            title: "Clase de Cálculo",
            type: "subject",
            repeatType: "custom",
            repeatDays: ["L", "M", "X", "J", "V"],
            times: ["08:00"],
            tone: "bell",
            vibration: true,
            active: true,
            createdAt: now.toISOString(),
            date: null,
            time: null,
          },
          {
            id: uuid(),
            title: "Entregar informe",
            type: "task",
            repeatType: "once",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
              .toISOString()
              .slice(0, 10),
            time: "10:00",
            times: null,
            repeatDays: null,
            tone: "bell",
            vibration: true,
            active: true,
            createdAt: now.toISOString(),
          },
        ] as any;
        loadedList = orderedByActivesAndTime(base as any);
        setAlarms(loadedList);
        await persist(loadedList);
      }

      if (last) setLastToneState(last);

      reseedAllActive(loadedList);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar alarmas");
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [hydrated, persist]);

  const listByType = useCallback(
    (type: AlarmType) => alarms.filter((a) => a.type === type),
    [alarms]
  );
  const getById = useCallback(
    (id: string) => alarms.find((a) => a.id === id),
    [alarms]
  );

  const create = useCallback(
    async (
      input: AlarmInput & { customByDay?: Record<string, string[]> | null }
    ) => {
      validate(input);
      const now = new Date().toISOString();
      const alarm: Alarm = { id: uuid(), createdAt: now, ...(input as any) };
      const next = orderedByActivesAndTime([...alarms, alarm]);
      setAlarms(next);
      await persist(next);
      presentStatusNotification("created", alarm).catch((e) =>
        console.warn("status-noti:create failed", e)
      );

      reseedAllActive(next);

      return alarm;
    },
    [alarms, persist]
  );

  const update = useCallback(
    async (
      id: string,
      patch: Partial<Alarm> & { customByDay?: Record<string, string[]> | null }
    ) => {
      const idx = alarms.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error("No existe la alarma");

      const prev = alarms[idx];
      const merged: Alarm = {
        ...prev,
        ...(patch as any),
        active:
          typeof (patch as any).active === "boolean"
            ? (patch as any).active
            : prev.active,
      };

      validate({
        title: (merged as any).title,
        type: (merged as any).type,
        linkedId: (merged as any).linkedId,
        repeatType: (merged as any).repeatType,
        date: (merged as any).date,
        time: (merged as any).time,
        times: (merged as any).times,
        repeatDays: (merged as any).repeatDays,
        tone: (merged as any).tone,
        vibration: (merged as any).vibration,
        active: (merged as any).active,
        customByDay: (merged as any).customByDay ?? null,
      });

      const next = [...alarms];
      next[idx] = merged;
      const ordered = orderedByActivesAndTime(next);
      setAlarms(ordered);
      await persist(ordered);

      presentStatusNotification("updated", merged).catch((e) =>
        console.warn("status-noti:update failed", e)
      );

      reseedAllActive(ordered);

      return merged;
    },
    [alarms, persist]
  );

  const toggleActive = useCallback(
    async (id: string, active: boolean) => {
      const next = alarms.map((a) => (a.id === id ? { ...a, active } : a));
      setAlarms(orderedByActivesAndTime(next));
      await persist(next);
      const changed = next.find((a) => a.id === id)!;

      presentStatusNotification(
        active ? "activated" : "deactivated",
        changed
      ).catch((e) => console.warn("status-noti:toggle failed", e));

      reseedAllActive(next);
    },
    [alarms, persist]
  );

  const remove = useCallback(
    async (id: string) => {
      const toDeleteRef = alarms.find((a) => a.id === id);

      const next = alarms.filter((a) => a.id !== id);
      setAlarms(orderedByActivesAndTime(next));
      await persist(next);

      if (toDeleteRef) {
        presentStatusNotification("removed", {
          ...(toDeleteRef as any),
        } as Alarm).catch((e) => console.warn("status-noti:remove failed", e));
      }

      reseedAllActive(next);
    },
    [alarms, persist]
  );

  const setLastTone = useCallback(async (tone: string) => {
    setLastToneState(tone);
    await AsyncStorage.setItem(KEY_LAST_TONE, tone);
  }, []);

  const clearAll = useCallback(async () => {
    setAlarms([]);
    await AsyncStorage.removeItem(KEY_LIST);
    await cancelAllAlarms();
  }, []);

  const ctx: Ctx = useMemo(
    () => ({
      alarms,
      loading,
      error,
      hydrated,
      lastTone,
      bootstrap,
      listByType,
      getById,
      create,
      update,
      toggleActive,
      remove,
      setLastTone,
      clearAll,
    }),
    [
      alarms,
      loading,
      error,
      hydrated,
      lastTone,
      bootstrap,
      listByType,
      getById,
      create,
      update,
      toggleActive,
      remove,
      setLastTone,
      clearAll,
    ]
  );

  return (
    <AlarmStoreContext.Provider value={ctx}>
      {children}
    </AlarmStoreContext.Provider>
  );
};

export function useAlarms() {
  const ctx = useContext(AlarmStoreContext);
  if (!ctx) throw new Error("useAlarms debe usarse dentro de AlarmsProvider");
  return ctx;
}
