import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";

export default function ConfigPomodoroScreen() {
  const router = useRouter();
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(20);
  const [cycles, setCycles] = useState(4);

  const startPomodoro = () => {
    console.log("Pomodoro iniciado con:", {
      focusTime,
      shortBreak,
      longBreak,
      cycles,
    });

    router.push("/Pomodoro/PomodoroScreen");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuracion Pomodoro</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.label}>Focus Time: {focusTime} min</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
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
            maximumValue={15}
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

          {/* Boton */}
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    color: "#0d47a1",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  button: {
    marginTop: 30,
    alignItems: "center",
  },
  customBtn: {
    backgroundColor: COLORS.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  customBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
