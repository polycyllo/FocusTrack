export type PomodoroSessionState = "idle" | "running" | "finished";

export type PomodoroVisualState = {
  background: string;
  primary: { label: string; color: string };
  secondary?: { label: string; color: string };
};

export const POMODORO_STATES: Record<PomodoroSessionState, PomodoroVisualState> = {
  idle: {
    background: "#e53935",
    primary: { label: "Iniciar Focus Time", color: "#f06292" },
  },
  running: {
    background: "#00695c",
    primary: { label: "Pausar", color: "#26a69a" },
  },
  finished: {
    background: "#1e88e5",
    primary: { label: "Continuar", color: "#90caf9" },
    secondary: { label: "Terminar", color: "#b0bec5" },
  },
};
