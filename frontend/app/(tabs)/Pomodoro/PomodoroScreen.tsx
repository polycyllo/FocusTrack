import { SafeAreaView, View, Text, StyleSheet, Pressable } from "react-native";
import { useState, useMemo } from "react";

type PomodoroSessionState = "idle" | "running";

const STATES: Record<PomodoroSessionState, {
  background: string;
  buttonLabel: string;
  buttonColor: string;
}> = {
  idle: {
    background: "#e53935",
    buttonLabel: "Iniciar Focus Time",
    buttonColor: "#f06292",
  },
  running: {
    background: "#00695c",
    buttonLabel: "Pausar",
    buttonColor: "#26a69a",
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

  const { background, buttonLabel, buttonColor } = useMemo(() => {
    return STATES[status];
  }, [status]);

  const timeLabel = "25:00";

  const toggleSession = () => {
    setStatus((prev) => (prev === "idle" ? "running" : "idle"));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }] }>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Text style={styles.title}>Pomodoro</Text>

        {/* Reloj del Pomodoro: aquí irá el componente final */}
        <TimerDisplayPlaceholder status={status} timeLabel={timeLabel} />

        <Pressable
          onPress={toggleSession}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: buttonColor },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.actionButtonText}>{buttonLabel}</Text>
        </Pressable>
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
});
