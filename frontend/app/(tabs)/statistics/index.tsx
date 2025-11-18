import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStatisticsStore } from "../../../src/store/statistics.store";
import { formatPomodoroTime } from "../../../src/utils/timeFormatter";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

function formatSecondsToTime(totalSeconds: number) {
  const SECONDS_PER_DAY = 86400;
  const SECONDS_PER_HOUR = 3600;
  const SECONDS_PER_MINUTE = 60;

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const remainingSecondsAfterDays = totalSeconds % SECONDS_PER_DAY;

  const hours = Math.floor(remainingSecondsAfterDays / SECONDS_PER_HOUR);
  const remainingSecondsAfterHours =
    remainingSecondsAfterDays % SECONDS_PER_HOUR;

  const minutes = Math.floor(remainingSecondsAfterHours / SECONDS_PER_MINUTE);

  const seconds = remainingSecondsAfterHours % SECONDS_PER_MINUTE;

  const daysStr = `${String(days)}d`;
  const hoursStr = `${String(hours).padStart(2, "0")}h`;
  const minutesStr = `${String(minutes).padStart(2, "0")}m`;
  const secondsStr = `${String(seconds).padStart(2, "0")}s`;

  if (days > 0) {
    return `${daysStr} ${hoursStr} ${minutesStr} ${secondsStr}`;
  } else if (hours > 0) {
    return `${hoursStr} ${minutesStr} ${secondsStr}`;
  } else {
    return `${minutesStr} ${secondsStr}`;
  }
}

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  primaryDark: "#0B2828",
  white: "#fff",
  border: "rgba(0,0,0,0.08)",
};

export default function StatisticsScreen() {
  const totalFocusSeconds = useStatisticsStore((s) => s.totalFocusSeconds);
  const stats = useStatisticsStore();
  const router = useRouter();

  // Cargar estadísticas cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      stats.refresh();
    }, [])
  );

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

  const renderHeaderBar = () => (
    <View style={styles.topHeader}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={styles.backBtn}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </Pressable>
      <Text style={styles.headerTitle}>Estadísticas</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <>
      {renderHeaderBar()}
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20 }}
      >
        {stats.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : (
          <>
            {/*tareas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progreso de Tareas</Text>
              {statCards.map((s, i) => (
                <View
                  key={i}
                  style={[styles.card, { borderLeftColor: s.color }]}
                >
                  <MaterialCommunityIcons
                    name={s.icon}
                    size={30}
                    color={s.color}
                  />
                  <View style={styles.cardTextBox}>
                    <Text style={styles.cardLabel}>{s.label}</Text>
                    <Text style={styles.cardValue}>{s.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/*Pomo*/}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiempo Total en Pomodoro</Text>
              <View style={[styles.card, { borderLeftColor: COLORS.card }]}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={30}
                  color={COLORS.card}
                />
                <View style={styles.cardTextBox}>
                  <Text style={styles.cardLabel}>Pomodoro General</Text>
                  <Text style={styles.cardValue}>
                    {formatSecondsToTime(totalFocusSeconds)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
});
