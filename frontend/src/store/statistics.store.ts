import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTasksCount } from "../features/tasks/repo";
import { getTotalPomodoroMinutes } from "../features/pomodoro/repo";

type Statistics = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  pomodoroMinutesTotal: number;
  totalFocusSeconds: number;
};

interface StatisticsState extends Statistics {
  refresh: () => Promise<void>;
  isLoading: boolean;
  incrementFocusSecond: () => void;
}

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set, get) => ({
      totalTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      pomodoroMinutesTotal: 0,
      totalFocusSeconds: 0,
      isLoading: false,

      incrementFocusSecond: () =>
        set((state) => ({
          totalFocusSeconds: state.totalFocusSeconds + 1,
        })),

      refresh: async () => {
        set({ isLoading: true });
        try {
          const tasksCount = await getTasksCount();
          const pomodoroMinutes = await getTotalPomodoroMinutes();

          set({
            totalTasks: tasksCount.total,
            pendingTasks: tasksCount.pending,
            completedTasks: tasksCount.completed,
            pomodoroMinutesTotal: pomodoroMinutes,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error al cargar estadísticas:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "statistics-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,

      partialize: (state) => ({
        totalFocusSeconds: state.totalFocusSeconds,
      }),
    }
  )
);
