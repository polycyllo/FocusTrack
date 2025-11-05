import { create } from "zustand";

type Statistics = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  pomodoroMinutesTotal: number;
};

interface StatisticsState extends Statistics {
  refresh: () => void;
}

export const useStatisticsStore = create<StatisticsState>(() => ({
  totalTasks: 25,
  pendingTasks: 8,
  completedTasks: 17,
  pomodoroMinutesTotal: 1570,
  refresh: () => {},
}));
