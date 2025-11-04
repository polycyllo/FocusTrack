import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStatisticsStore } from "../../../src/store/statistics.store";
import { formatPomodoroTime } from "../../../src/utils/timeFormatter";

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  primaryDark: "#0B2828",
  white: "#fff",
  border: "rgba(0,0,0,0.08)",
};

export default function StatisticsScreen() {
  const stats = useStatisticsStore();

  const statCards = [
    {
      label: "Tareas Totales",
      value: stats.totalTasks,
      icon: "format-list-bulleted" as const,
      color: COLORS.primaryDark,
    },
    {
      label: "Tareas Pendientes",
      value: stats.pendingTasks,
      icon: "clock-outline" as const,
      color: "#E67E22",
    },
    {
      label: "Tareas Completadas",
      value: stats.completedTasks,
      icon: "check-circle-outline" as const,
      color: "#27AE60",
    },
  ];

  const pomodoroData = [
    {
      label: "Pomodoro en Tareas",
      value: formatPomodoroTime(stats.pomodoroMinutesTasks),
      icon: "timer-sand" as const,
      color: COLORS.primary,
    },
    {
      label: "Pomodoro en Materias",
      value: formatPomodoroTime(stats.pomodoroMinutesSubjects),
      icon: "book-open-variant" as const,
      color: COLORS.card,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={styles.title}>Estadísticas</Text>

      {/* las tareas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progreso de Tareas</Text>
        {statCards.map((s, i) => (
          <View key={i} style={[styles.card, { borderLeftColor: s.color }]}>
            <MaterialCommunityIcons name={s.icon} size={30} color={s.color} />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardLabel}>{s.label}</Text>
              <Text style={styles.cardValue}>{s.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* el pomodoro */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiempo en Pomodoro</Text>
        {pomodoroData.map((p, i) => (
          <View key={i} style={[styles.card, { borderLeftColor: p.color }]}>
            <MaterialCommunityIcons name={p.icon} size={30} color={p.color} />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardLabel}>{p.label}</Text>
              <Text style={styles.cardValue}>{p.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 5,
  },
  cardTextBox: {
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});
