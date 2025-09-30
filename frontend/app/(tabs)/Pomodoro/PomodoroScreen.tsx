import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { useRouter, Href } from "expo-router";

import { usePomodoroStore } from "@/src/store/pomodoro.store";
import { useSubjectsStore } from "@/src/store/subjects.store";

const MODE_LABEL: Record<"focus" | "short" | "long", string> = {
  focus: "Enfoque",
  short: "Descanso corto",
  long: "Descanso largo",
};

export default function PomodoroScreen() {
  const router = useRouter();

  const session = usePomodoroStore((s) => s.session);
  const pause = usePomodoroStore((s) => s.pause);
  const resume = usePomodoroStore((s) => s.resume);
  const nextPhase = usePomodoroStore((s) => s.nextPhase);
  const reset = usePomodoroStore((s) => s.reset);
  const tick = usePomodoroStore((s) => s.tick);

  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectName = useMemo(() => {
    const found = subjects.find((x) => x.id === session.subjectId);
    return found?.name;
  }, [subjects, session.subjectId]);

  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  const minutes = Math.floor(session.remaining / 60);
  const seconds = session.remaining % 60;
  const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace("/(tabs)/Pomodoro/PomodoroConfigForm" as Href)
            }
            style={styles.backBtn}
          >
            <Text style={styles.backTxt}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Pomodoro</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          {subjectName ? (
            <Text style={styles.subject}>{subjectName}</Text>
          ) : null}
          <Text style={styles.mode}>{MODE_LABEL[session.mode]}</Text>
          <Text style={styles.timer}>{time}</Text>

          <View style={styles.row}>
            {session.isRunning ? (
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={pause}
              >
                <Text style={styles.btnText}>Pausar</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={resume}
              >
                <Text style={styles.btnText}>Reanudar</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={nextPhase}
            >
              <Text style={styles.btnText}>Siguiente</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.btn, styles.btnDanger]} onPress={reset}>
            <Text style={styles.btnText}>Reiniciar todo</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const COLORS = {
  background: "#90caf9",
  header: "#1976d2",
  text: "#0d47a1",
  primary: "#1565c0",
  secondary: "#70B1EA",
  danger: "#e74c3c",
  white: "#fff",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6, borderRadius: 8 },
  backTxt: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  subject: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  mode: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  timer: {
    color: COLORS.text,
    fontSize: 72,
    fontWeight: "800",
    letterSpacing: 2,
  },

  row: { flexDirection: "row", gap: 12 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: COLORS.secondary },
  btnDanger: { backgroundColor: COLORS.danger },
  btnText: { color: COLORS.white, fontWeight: "700" },
});
