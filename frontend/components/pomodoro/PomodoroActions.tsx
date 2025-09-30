import { memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";

import type { PomodoroVisualState } from "@/constants/pomodoro";

export type PomodoroActionsProps = {
  visualState: PomodoroVisualState;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
};

function PomodoroActions({ visualState, onPrimaryPress, onSecondaryPress }: PomodoroActionsProps) {
  if (!visualState.secondary) {
    return (
      <Pressable
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: visualState.primary.color },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryLabel}>{visualState.primary.label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.finishedActions}>
      <Pressable
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.secondaryButton,
          { backgroundColor: visualState.primary.color },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryLabel}>{visualState.primary.label}</Text>
      </Pressable>
      <Pressable
        onPress={onSecondaryPress}
        style={({ pressed }) => [
          styles.secondaryButton,
          { backgroundColor: visualState.secondary?.color },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryLabel}>{visualState.secondary?.label}</Text>
      </Pressable>
    </View>
  );
}

export default memo(PomodoroActions);

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  primaryLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  finishedActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryButton: {
    marginHorizontal: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  secondaryLabel: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "600",
  },
});
