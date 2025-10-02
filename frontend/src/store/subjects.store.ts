import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleItem = {
  day: DayIndex;
  start: string;
  end: string;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
  schedule: ScheduleItem[];
  createdAt: string;
};

type SubjectsState = {
  subjects: Subject[];
  addSubject: (s: Subject) => void;
  removeSubject: (id: string) => void;
  clearAll: () => void;
};

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set) => ({
      subjects: [],
      addSubject: (s) => set((st) => ({ subjects: [s, ...st.subjects] })),
      removeSubject: (id) =>
        set((st) => ({ subjects: st.subjects.filter((x) => x.id !== id) })),
      clearAll: () => set({ subjects: [] }),
    }),
    {
      name: "subjects-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
