import { SafeAreaView, View, Text, StyleSheet, Pressable } from "react-native";
import { useState, useMemo } from "react";

type PomodoroSessionState = "idle" | "running" | "finished";
type PomodoroVisualState = {
  background: string;
  primary: { label: string; color: string };
  secondary?: { label: string; color: string };
};

const STATES: Record<PomodoroSessionState, PomodoroVisualState> = {
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

// Placeholder del reloj: reemplazar este componente por la implementación real.
const TimerDisplayPlaceholder = ({
  status,
  timeLabel,
}: {
  status: PomodoroSessionState;
  timeLabel: string;
}) => (
  <View style={styles.timerCircle}>
    <Text style={styles.timerText}>{timeLabel}</Text>
  </View>
);

export default function PomodoroSessionScreen() {
  const [status, setStatus] = useState<PomodoroSessionState>("idle");

  const visualState = useMemo(() => STATES[status], [status]);
  const timeLabel = "25:00";

  const toggleSession = () => {
    setStatus((prev) => {
      if (prev === "idle") return "running";
      if (prev === "running") return "finished";
      return "idle";
    });
  };

  const handleContinue = () => setStatus("running");
  const handleFinish = () => setStatus("idle");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: visualState.background }]}>
      <View style={[styles.container, { backgroundColor: visualState.background }]}>
        <Text style={styles.title}>Pomodoro</Text>

        {/* Reloj del Pomodoro: aquí irá el componente final */}
        <TimerDisplayPlaceholder status={status} timeLabel={timeLabel} />

        {status !== "finished" ? (
          <Pressable
            onPress={toggleSession}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: visualState.primary.color },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.actionButtonText}>{visualState.primary.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.finishedActions}>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.finishedButton,
                { backgroundColor: visualState.primary.color },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.finishedButtonText}>{visualState.primary.label}</Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.finishedButton,
                { backgroundColor: visualState.secondary?.color },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.finishedButtonText}>{visualState.secondary?.label}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#ffffff",
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
  },
  actionButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  finishedActions: {
    flexDirection: "row",
    columnGap: 12,
  },
  finishedButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  finishedButtonText: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "600",
  },
});
