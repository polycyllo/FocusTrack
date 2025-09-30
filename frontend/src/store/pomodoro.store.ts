import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
};

type PomodoroState = {
  config: PomodoroConfig;
  session: PomodoroSession;
  setConfig: (c: PomodoroConfig) => void;
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
});

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      config: DEFAULTS,
      session: makeInitialSession(),

      setConfig: (c) =>
        set((s) => ({
          config: { ...s.config, ...c },
          session: {
            ...s.session,
            mode: "focus",
            remaining: (c.focusTime ?? s.config.focusTime) * 60,
            isRunning: false,
          },
        })),

      setSubject: (subjectId) =>
        set((s) => ({ session: { ...s.session, subjectId } })),

      start: () => set((s) => ({ session: { ...s.session, isRunning: true } })),
      pause: () =>
        set((s) => ({ session: { ...s.session, isRunning: false } })),
      resume: () =>
        set((s) => ({ session: { ...s.session, isRunning: true } })),

      reset: () =>
        set(() => ({
          config: DEFAULTS,
          session: makeInitialSession(),
        })),

      nextPhase: () =>
        set((s) => {
          const { config, session } = s;
          if (session.mode === "focus") {
            const nextCompleted = session.completedFocus + 1;
            if (nextCompleted % config.cycles === 0) {
              return {
                session: {
                  ...session,
                  mode: "long",
                  remaining: config.longBreak * 60,
                  isRunning: false,
                  completedFocus: nextCompleted,
                },
              };
            }
            return {
              session: {
                ...session,
                mode: "short",
                remaining: config.shortBreak * 60,
                isRunning: false,
                completedFocus: nextCompleted,
              },
            };
          }
          return {
            session: {
              ...session,
              mode: "focus",
              remaining: config.focusTime * 60,
              isRunning: false,
            },
          };
        }),

      startWithConfig: (c) => {
        set((s) => ({
          config: { ...s.config, ...c },
          session: {
            ...s.session,
            mode: "focus",
            remaining: (c.focusTime ?? s.config.focusTime) * 60,
            isRunning: true,
            completedFocus: 0,
          },
        }));
      },

      tick: () => {
        const s = get();
        if (!s.session.isRunning) return;

        const cur = s.session.remaining;
        if (cur <= 1) {
          const { config, session } = s;
          if (session.mode === "focus") {
            const nextCompleted = session.completedFocus + 1;
            if (nextCompleted % config.cycles === 0) {
              set({
                session: {
                  ...session,
                  mode: "long",
                  remaining: config.longBreak * 60,
                  isRunning: false,
                  completedFocus: nextCompleted,
                },
              });
            } else {
              set({
                session: {
                  ...session,
                  mode: "short",
                  remaining: config.shortBreak * 60,
                  isRunning: false,
                  completedFocus: nextCompleted,
                },
              });
            }
          } else {
            set({
              session: {
                ...s.session,
                mode: "focus",
                remaining: s.config.focusTime * 60,
                isRunning: false,
              },
            });
          }
          return;
        }

        set({ session: { ...s.session, remaining: cur - 1 } });
      },
    }),
    {
      name: "pomodoro-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
