import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

import type { PomodoroSessionState } from "@/constants/pomodoro";

export type PomodoroTimerProps = {
  status: PomodoroSessionState;
  timeLabel: string;
};

// Aqui se debe reemplazar el comoponente reloj para el pomodoro
function PomodoroTimer({ timeLabel }: PomodoroTimerProps) {
  return (
    <View style={styles.timerCircle}>
      <Text style={styles.timerText}>{timeLabel}</Text>
    </View>
  );
}
//-----------------------------------------------------
export default memo(PomodoroTimer);

const styles = StyleSheet.create({
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
});
