import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";


import { usePomodoroStore } from "@/src/store/pomodoro.store";

export default function PomodoroConfigForm() {
  const router = useRouter();
  const { from, subjectId, subjectTitle } = useLocalSearchParams<{
  from?: string;
  subjectId?: string;
  subjectTitle?: string;
}>();



  const config = usePomodoroStore((s) => s.config);
  const setConfig = usePomodoroStore((s) => s.setConfig);
  const startWithConfig = usePomodoroStore((s) => s.startWithConfig);

  const [focusTime, setFocusTime] = useState(config.focusTime);
  const [shortBreak, setShortBreak] = useState(config.shortBreak);
  const [longBreak, setLongBreak] = useState(config.longBreak);
  const [cycles, setCycles] = useState(config.cycles);

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

  const startPomodoro = () => {
    const err = validate();
    if (err) {
      Alert.alert("Revisa la configuración", err);
      return;
    }

    const next = { focusTime, shortBreak, longBreak, cycles };
    setConfig(next);
    startWithConfig(next);

    router.push("/(tabs)/Pomodoro/PomodoroScreen" as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
         <Pressable
            onPress={() => {
           if (from === "subjects") {
            router.replace("/subjects");
           } else if (from === "tasks") {
            router.replace({
            pathname: "/tasks",
            params: {
            subjectId,
            subjectTitle,
             refresh: Date.now().toString(),
           },
          });
          } else {
            router.back();
           }
          }}

        style={{ position: "absolute", left: 16, padding: 4 }}
         >
       <Ionicons name="arrow-back" size={24} color="#fff" />
       </Pressable>

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
              style={({ pressed }) => [
                styles.customBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.customBtnText}>Comenzar Pomodoro</Text>
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
