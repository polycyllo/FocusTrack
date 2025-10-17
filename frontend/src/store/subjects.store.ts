import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  addSubjectWithSchedules,
  getAllSubjectsWithSchedules,
  printAllSubjectsWithSchedules,
} from '../features/subjects/repo'

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type ScheduleItem = {
  day: DayIndex
  start: string
  end: string
}

export type Subject = {
  id: string
  name: string
  color: string
  icon: string
  schedule: ScheduleItem[]
  createdAt: string
}

type SubjectsState = {
  subjects: Subject[]
  addSubject: (s: Omit<Subject, 'id' | 'createdAt'> & { schedules?: ScheduleItem[] }) => Promise<string | null>
  removeSubject: (id: string) => void
  clearAll: () => void
  reload: () => Promise<void>
  printAllFromDb: () => Promise<void>
}

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
      subjects: [],

      // addSubject persists to DB then reloads the subjects list
      addSubject: async (s) => {
        const payload = {
          title: s.name,
          description: null,
          color: s.color,
          schedules: s.schedule?.map((sc) => ({ day: sc.day, start: sc.start, end: sc.end })) ?? [],
        }

        try {
          // debug: show payload being inserted
          // eslint-disable-next-line no-console
          console.log('[subjects.store] addSubject payload:', payload)
          const id = await addSubjectWithSchedules(payload as any)
          // debug: show returned id
          // eslint-disable-next-line no-console
          console.log('[subjects.store] addSubject returned id:', id)

          // reload subjects from DB
          // eslint-disable-next-line no-console
          console.log('[subjects.store] calling reload()')
          await get().reload()
          // eslint-disable-next-line no-console
          console.log('[subjects.store] reload() completed')
          return id
        } catch (e) {
          console.error('Error adding subject', e)
          return null
        }
      },

      removeSubject: (id) => set((st) => ({ subjects: st.subjects.filter((x) => x.id !== id) })),

      clearAll: () => set({ subjects: [] }),

      // reload reads from DB and maps to the store shape
      reload: async () => {
        try {
          // debug: indicate reload start
          // eslint-disable-next-line no-console
          console.log('[subjects.store] reload(): fetching from DB...')
          const rows = await getAllSubjectsWithSchedules()
          // eslint-disable-next-line no-console
          console.log('[subjects.store] reload(): rows fetched:', rows?.length)

          const mapped: Subject[] = rows.map((r: any) => {
            const subj = r.subject
            const schedules = (r.schedules || []).map((sch: any) => ({
              day: sch.day as DayIndex,
              start: sch.startTime,
              end: sch.endTime,
            }))
            return {
              id: String(subj.subjectId ?? subj.subject_id),
              name: subj.title,
              color: subj.color ?? '#000',
              icon: 'book',
              schedule: schedules,
              createdAt: subj.created_at ?? new Date().toISOString(),
            }
          })
          set({ subjects: mapped })
          // print subjects for monitoring/debugging
          try {
            // eslint-disable-next-line no-console
            console.table(mapped.map((m) => ({ id: m.id, name: m.name, color: m.color, scheduleCount: m.schedule.length })))
          } catch (e) {
            /* ignore console table errors on some environments */
          }
        } catch (e) {
          console.error('Failed to reload subjects', e)
        }
      },
      // call repo helper to print full dump
      printAllFromDb: async () => {
        try {
          // eslint-disable-next-line no-console
          console.log('[subjects.store] printAllFromDb()')
          await printAllSubjectsWithSchedules()
        } catch (e) {
          console.error('printAllFromDb failed', e)
        }
      },
    }),
    {
      name: 'subjects-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
)
