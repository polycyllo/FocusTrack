import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter, Href, useFocusEffect } from "expo-router";

import { usePomodoroStore } from "@/src/store/pomodoro.store";
import {
  getPomodoroConfigBySubject,
  upsertPomodoroConfigForSubject,
} from "@/src/features/pomodoro/repo";

export default function PomodoroConfigForm() {
  const router = useRouter();

  const sessionSubjectId = usePomodoroStore((s) => s.session.subjectId);
  const setConfig = usePomodoroStore((s) => s.setConfig);
  const startWithConfig = usePomodoroStore((s) => s.startWithConfig);

  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(20);
  const [cycles, setCycles] = useState(4);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (focusTime < 1 || focusTime > 60)
      return "Focus Time debe estar entre 1 y 60.";
    if (shortBreak < 1 || shortBreak > 30)
      return "Short Break debe estar entre 1 y 30.";
    if (longBreak < 5 || longBreak > 60)
      return "Long Break debe estar entre 5 y 60.";
    if (cycles < 1 || cycles > 10) return "Ciclos debe estar entre 1 y 10.";
    return null;
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadConfig = async () => {
        if (!sessionSubjectId) return;

        const numericId = Number(sessionSubjectId);
        if (Number.isNaN(numericId)) {
          console.warn(
            "[PomodoroConfigForm] subjectId inválido:",
            sessionSubjectId
          );
          return;
        }

        setLoading(true);
        try {
          const stored = await getPomodoroConfigBySubject(numericId);
          if (!active) return;

          if (stored) {
            setFocusTime(stored.focus ?? 25);
            setShortBreak(stored.shortBreak ?? 5);
            setLongBreak(stored.longBreak ?? 20);
            setCycles(stored.cicle ?? 4);
          } else {
            setFocusTime(25);
            setShortBreak(5);
            setLongBreak(20);
            setCycles(4);
          }
        } catch (error) {
          console.error("Error cargando config pomodoro:", error);
          if (active) {
            Alert.alert(
              "Error",
              "No se pudo cargar la configuración guardada para esta materia."
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadConfig();
      return () => {
        active = false;
      };
    }, [sessionSubjectId])
  );

  const startPomodoro = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Revisa la configuración", err);
      return;
    }

    if (!sessionSubjectId) {
      Alert.alert(
        "Materia no seleccionada",
        "Selecciona una materia antes de configurar el pomodoro."
      );
      return;
    }

    const numericId = Number(sessionSubjectId);
    if (Number.isNaN(numericId)) {
      Alert.alert(
        "Materia inválida",
        "No se pudo identificar la materia seleccionada."
      );
      return;
    }

    if (saving) return;

    const next = { focusTime, shortBreak, longBreak, cycles };

    try {
      setSaving(true);
      await upsertPomodoroConfigForSubject(numericId, {
        focus: focusTime,
        shortBreak,
        longBreak,
        cicle: cycles,
      });

      setConfig(next);
      startWithConfig(next);

      router.push("/(tabs)/Pomodoro/PomodoroScreen" as Href);
    } catch (error) {
      console.error("Error guardando config pomodoro:", error);
      Alert.alert(
        "Error",
        "No se pudo guardar la configuración del pomodoro."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuración Pomodoro</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.label}>Focus Time: {focusTime} min</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={60}
            step={1}
            value={focusTime}
            onValueChange={setFocusTime}
            minimumTrackTintColor="#0d47a1"
            maximumTrackTintColor="#b0bec5"
          />

          <Text style={styles.label}>Short Break: {shortBreak} min</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={shortBreak}
            onValueChange={setShortBreak}
            minimumTrackTintColor="#0d47a1"
            maximumTrackTintColor="#b0bec5"
          />

          <Text style={styles.label}>Long Break: {longBreak} min</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={1}
            value={longBreak}
            onValueChange={setLongBreak}
            minimumTrackTintColor="#0d47a1"
            maximumTrackTintColor="#b0bec5"
          />

          <Text style={styles.label}>Ciclos: {cycles}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={cycles}
            onValueChange={setCycles}
            minimumTrackTintColor="#0d47a1"
            maximumTrackTintColor="#b0bec5"
          />

          {/* Botón */}
          <View style={styles.button}>
            <Pressable
              onPress={startPomodoro}
              disabled={saving || loading}
              style={({ pressed }) => [
                styles.customBtn,
                pressed && { opacity: 0.85 },
                (saving || loading) && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.customBtnText}>
                {saving ? "Guardando..." : "Comenzar Pomodoro"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const COLORS = {
  background: "#90caf9",
  header: "#1976d2",
  button: "#70B1EA",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  body: { flex: 1, padding: 20, justifyContent: "space-between" },
  label: { fontSize: 16, marginTop: 15, color: "#0d47a1" },
  slider: { width: "100%", height: 40 },
  button: { marginTop: 30, alignItems: "center" },
  customBtn: {
    backgroundColor: COLORS.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  customBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
