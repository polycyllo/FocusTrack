import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alarm, AlarmInput, AlarmType, RepeatType } from "../types/alarms";
import { DAYS, compareTimeAsc, toHHmm } from "../utils/time";

const KEY_LIST = "@app/alarms:list";
const KEY_LAST_TONE = "@app/alarms:lastTone";

// ---- helpers ----
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

function orderedByActivesAndTime(alarms: Alarm[]) {
  return [...alarms].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    const ta = a.time ?? a.times?.[0] ?? "00:00";
    const tb = b.time ?? b.times?.[0] ?? "00:00";
    return compareTimeAsc(ta, tb);
  });
}

function validate(input: AlarmInput) {
  if (!input.title?.trim()) throw new Error("El título es requerido.");
  if (!["subject", "task", "other"].includes(input.type))
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
    if (!input.repeatDays || input.repeatDays.length === 0)
      throw new Error("Selecciona al menos un día.");
    if (!input.times || input.times.length === 0)
      throw new Error("Agrega al menos una hora.");
    const invalid = input.repeatDays.some((d) => !DAYS.includes(d as any));
    if (invalid) throw new Error("Día inválido.");
  }
}

// ---- contexto/store ----
type Ctx = {
  alarms: Alarm[];
  loading: boolean;
  error?: string;
  hydrated: boolean;
  lastTone?: string;

  bootstrap: () => Promise<void>;
  listByType: (type: AlarmType) => Alarm[];
  getById: (id: string) => Alarm | undefined;

  create: (input: AlarmInput) => Promise<Alarm>;
  update: (id: string, patch: Partial<Alarm>) => Promise<Alarm>;
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

  const bootstrap = useCallback(async () => {
    if (hydrated) return;
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(KEY_LIST);
      const last = await AsyncStorage.getItem(KEY_LAST_TONE);
      if (raw) {
        const parsed: Alarm[] = JSON.parse(raw);
        setAlarms(orderedByActivesAndTime(parsed));
      } else {
        // seed
        const now = new Date();
        const base: Alarm[] = [
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
            tone: "ding",
            vibration: true,
            active: true,
            createdAt: now.toISOString(),
          },
          {
            id: uuid(),
            title: "Descanso corto",
            type: "other",
            repeatType: "daily",
            time: "16:00",
            date: null,
            times: null,
            repeatDays: null,
            tone: "chime",
            vibration: false,
            active: false,
            createdAt: now.toISOString(),
          },
        ];
        setAlarms(orderedByActivesAndTime(base));
        await persist(base);
      }
      if (last) setLastToneState(last);
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
    async (input: AlarmInput) => {
      validate(input);
      const now = new Date().toISOString();
      const alarm: Alarm = { id: uuid(), createdAt: now, ...input };
      const next = orderedByActivesAndTime([...alarms, alarm]);
      setAlarms(next);
      await persist(next);
      return alarm;
    },
    [alarms, persist]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Alarm>) => {
      const idx = alarms.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error("No existe la alarma");
      const merged: Alarm = { ...alarms[idx], ...patch };
      // Validar con el tipo actual
      validate({
        title: merged.title,
        type: merged.type,
        linkedId: merged.linkedId,
        repeatType: merged.repeatType,
        date: merged.date!,
        time: merged.time!,
        times: merged.times!,
        repeatDays: merged.repeatDays!,
        tone: merged.tone,
        vibration: merged.vibration,
        active: merged.active,
      } as any);

      const next = [...alarms];
      next[idx] = merged;
      const ordered = orderedByActivesAndTime(next);
      setAlarms(ordered);
      await persist(ordered);
      return merged;
    },
    [alarms, persist]
  );

  const toggleActive = useCallback(
    async (id: string, active: boolean) => {
      const next = alarms.map((a) => (a.id === id ? { ...a, active } : a));
      setAlarms(orderedByActivesAndTime(next));
      await persist(next);
    },
    [alarms, persist]
  );

  const remove = useCallback(
    async (id: string) => {
      const next = alarms.filter((a) => a.id !== id);
      setAlarms(orderedByActivesAndTime(next));
      await persist(next);
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
