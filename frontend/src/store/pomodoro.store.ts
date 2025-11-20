import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { savePomodoroSession } from "../features/pomodoro/repo";
import { useStatisticsStore } from "./statistics.store";

export type PomodoroMode = "focus" | "short" | "long";

export type PomodoroConfig = {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
};

export type PomodoroSession = {
  mode: PomodoroMode;
  remaining: number;
  isRunning: boolean;
  completedFocus: number;
  subjectId?: string | null;
  taskId?: string | null;
  endTime: number | null;
};

type PomodoroState = {
  config: PomodoroConfig;
  session: PomodoroSession;
  timerId: ReturnType<typeof setInterval> | null;
  savedConfigs: Record<string, PomodoroConfig>;

  setConfig: (c: PomodoroConfig) => void;
  saveConfigByKey: (key: string, c: PomodoroConfig) => void;

  setContext: (
    subjectId: string | null,
    taskId: string | null,
    configKey: string | null
  ) => void;

  setSubject: (subjectId: string | null) => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  nextPhase: () => void;
  startWithConfig: (c: PomodoroConfig) => void;
  tick: () => void;
};

const DEFAULTS: PomodoroConfig = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 20,
  cycles: 4,
};

const makeInitialSession = (): PomodoroSession => ({
  mode: "focus",
  remaining: DEFAULTS.focusTime * 60,
  isRunning: false,
  completedFocus: 0,
  subjectId: null,
  taskId: null,
  endTime: null,
});

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      config: DEFAULTS,
      session: makeInitialSession(),
      timerId: null,
      savedConfigs: {},

      setConfig: (c) =>
        set((s) => ({
          config: { ...s.config, ...c },
          session: {
            ...s.session,
            mode: "focus",
            remaining: (c.focusTime ?? s.config.focusTime) * 60,
            isRunning: false,
            endTime: null,
          },
        })),

      saveConfigByKey: (key, c) =>
        set((s) => {
          const currentSaved = s.savedConfigs || {};
          return {
            savedConfigs: { ...currentSaved, [key]: c },
            config: { ...s.config, ...c },
            session: {
              ...s.session,
              mode: "focus",
              remaining: (c.focusTime ?? s.config.focusTime) * 60,
              isRunning: false,
              endTime: null,
            },
          };
        }),

      setContext: (subjectId, taskId, configKey) =>
        set((s) => {
          let targetConfig = DEFAULTS;
          const currentSaved = s.savedConfigs || {};

          if (configKey && currentSaved[configKey]) {
            targetConfig = currentSaved[configKey];
          } else if (subjectId && currentSaved[subjectId]) {
            targetConfig = currentSaved[subjectId];
          }

          return {
            session: {
              ...s.session,
              subjectId,
              taskId,
              mode: "focus",
              remaining: targetConfig.focusTime * 60,
              isRunning: false,
              endTime: null,
            },
            config: targetConfig,
          };
        }),

      setSubject: (subjectId) => {
        const configKey = subjectId ? `subject-${subjectId}` : null;
        get().setContext(subjectId, null, configKey);
      },

      start: () => get().resume(),

      pause: () =>
        set((s) => {
          if (s.timerId) clearInterval(s.timerId);
          return {
            session: { ...s.session, isRunning: false, endTime: null },
            timerId: null,
          };
        }),

      resume: () =>
        set((s) => {
          if (s.timerId) return s;
          const newEndTime = Date.now() + s.session.remaining * 1000;
          const id = setInterval(() => get().tick(), 1000);
          return {
            session: { ...s.session, isRunning: true, endTime: newEndTime },
            timerId: id,
          };
        }),

      reset: () =>
        set((s) => {
          if (s.timerId) clearInterval(s.timerId);
          return {
            session: {
              mode: "focus",
              remaining: s.config.focusTime * 60,
              isRunning: false,
              completedFocus: 0,
              subjectId: s.session.subjectId,
              taskId: s.session.taskId,
              endTime: null,
            },
            timerId: null,
          };
        }),

      nextPhase: () => set((s) => s),

      startWithConfig: (c) => {
        const remaining = (c.focusTime ?? DEFAULTS.focusTime) * 60;
        set((s) => {
          if (s.timerId) clearInterval(s.timerId);
          const id = setInterval(() => get().tick(), 1000);
          return {
            config: { ...s.config, ...c },
            session: {
              ...s.session,
              mode: "focus",
              remaining: remaining,
              isRunning: true,
              completedFocus: 0,
              endTime: Date.now() + remaining * 1000,
            },
            timerId: id,
          };
        });
      },

      tick: () => {
        set((s) => {
          if (!s.session.isRunning || !s.session.endTime) return s;

          const newRemaining = Math.ceil(
            (s.session.endTime - Date.now()) / 1000
          );
          const oldRemaining = s.session.remaining;

          if (s.session.mode === "focus") {
            const passed = oldRemaining - newRemaining;
            if (passed > 0) {
              for (let i = 0; i < passed; i++)
                useStatisticsStore.getState().incrementFocusSecond();
            }
          }

          if (newRemaining <= 0) {
            if (s.timerId) clearInterval(s.timerId);

            const { config, session } = s;
            if (session.mode === "focus") {
              const subjectId = session.subjectId
                ? parseInt(session.subjectId)
                : null;
              savePomodoroSession({
                focus: config.focusTime,
                shortBreak: config.shortBreak,
                longBreak: config.longBreak,
                cicle: config.cycles,
                subjectId: subjectId,
              }).catch(console.error);
            }

            const nextCompleted =
              session.mode === "focus"
                ? session.completedFocus + 1
                : session.completedFocus;
            const isLong =
              session.mode === "focus" && nextCompleted % config.cycles === 0;

            let nextState: Partial<PomodoroSession> = {
              isRunning: false,
              endTime: null,
              completedFocus: nextCompleted,
            };

            if (isLong) {
              nextState.mode = "long";
              nextState.remaining = config.longBreak * 60;
            } else if (session.mode === "focus") {
              nextState.mode = "short";
              nextState.remaining = config.shortBreak * 60;
            } else {
              nextState.mode = "focus";
              nextState.remaining = config.focusTime * 60;
            }

            return {
              session: { ...session, ...nextState },
              timerId: null,
            };
          }

          if (newRemaining === oldRemaining) return s;

          return { session: { ...s.session, remaining: newRemaining } };
        });
      },
    }),
    {
      name: "pomodoro-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        config: state.config,
        session: state.session,
        savedConfigs: state.savedConfigs,
      }),
    }
  )
);
