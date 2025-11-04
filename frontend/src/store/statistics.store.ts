import { create } from "zustand";

type Statistics = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  pomodoroMinutesTasks: number;
  pomodoroMinutesSubjects: number;
};

interface StatisticsState extends Statistics {
  refresh: () => void;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  totalTasks: 25,
  pendingTasks: 8,
  completedTasks: 17,
  pomodoroMinutesTasks: 750,
  pomodoroMinutesSubjects: 3200,
  refresh: () => {
    set((state) => ({ ...state }));
  },
}));
