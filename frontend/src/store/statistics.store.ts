import { create } from "zustand";
import { getTasksCount } from "../features/tasks/repo";
import { getTotalPomodoroMinutes } from "../features/pomodoro/repo";

type Statistics = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  pomodoroMinutesTotal: number;
};

interface StatisticsState extends Statistics {
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  totalTasks: 0,
  pendingTasks: 0,
  completedTasks: 0,
  pomodoroMinutesTotal: 0,
  isLoading: false,

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
}));
