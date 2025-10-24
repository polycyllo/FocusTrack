export type RepeatType = "once" | "daily" | "custom";
export type AlarmType = "subject" | "task";

export type DayMap = Record<string, string[]>;

export type Alarm = {
  id: string;
  title: string;
  type: AlarmType;
  linkedId?: string | null;

  repeatType: RepeatType;
  date?: string | null;
  time?: string | null;
  times?: string[] | null;
  repeatDays?: string[] | null;
  customByDay?: DayMap | null;

  tone: string;
  vibration: boolean;
  active: boolean;

  createdAt: string;
};

export type AlarmInput = Omit<Alarm, "id" | "createdAt">;
