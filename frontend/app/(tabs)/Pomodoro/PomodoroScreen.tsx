import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useMemo, useState } from "react";

import PomodoroActions from "@/components/pomodoro/PomodoroActions";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import { POMODORO_STATES, type PomodoroSessionState } from "@/constants/pomodoro";

const INITIAL_TIME_LABEL = "25:00";

export default function PomodoroSessionScreen() {
  const [status, setStatus] = useState<PomodoroSessionState>("idle");

  const visualState = useMemo(() => POMODORO_STATES[status], [status]);
  const timeLabel = INITIAL_TIME_LABEL;

  const handlePrimaryPress = () => {
    if (status === "finished") {
      setStatus("running");
      return;
    }

    setStatus((prev) => (prev === "idle" ? "running" : "finished"));
  };

  const handleSecondaryPress = () => {
    setStatus("idle");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: visualState.background }]}>
      <View style={[styles.container, { backgroundColor: visualState.background }]}>
        <Text style={styles.title}>Pomodoro</Text>

        {/* Reloj del Pomodoro: aquí irá el componente final */}
        <PomodoroTimer status={status} timeLabel={timeLabel} />

        <PomodoroActions
          visualState={visualState}
          onPrimaryPress={handlePrimaryPress}
          onSecondaryPress={visualState.secondary ? handleSecondaryPress : undefined}
        />
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
});
