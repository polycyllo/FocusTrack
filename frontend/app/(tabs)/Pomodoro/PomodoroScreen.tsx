import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter, Href } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { usePomodoroStore } from "@/src/store/pomodoro.store";
import { useSubjectsStore } from "@/src/store/subjects.store";

import type { PomodoroSessionState } from "@/constants/pomodoro";
import { POMODORO_STATES } from "@/constants/pomodoro";

const RING_SIZE = 260;
const STROKE = 8;
const R = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const WHITE = "#FFFFFF";
const SECONDARY_TEXT = "#0A0A0A";

export default function PomodoroScreen() {
  const router = useRouter();

  const session = usePomodoroStore((s) => s.session);
  const pause = usePomodoroStore((s) => s.pause);
  const resume = usePomodoroStore((s) => s.resume);
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

  const [hasStarted, setHasStarted] = useState<boolean>(session.isRunning);
  useEffect(() => {
    if (session.isRunning && !hasStarted) setHasStarted(true);
  }, [session.isRunning, hasStarted]);

  const isRunning = session.isRunning;
  const isIdle = !session.isRunning && !hasStarted;
  const isPaused = !session.isRunning && hasStarted;

  const [cachedSubjectName, setCachedSubjectName] = useState<
    string | undefined
  >(undefined);
  useEffect(() => {
    if (subjectName) setCachedSubjectName(subjectName);
  }, [subjectName]);
  const displaySubject = subjectName ?? cachedSubjectName;

  const minutes = Math.floor(session.remaining / 60);
  const seconds = session.remaining % 60;
  const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;

  const [initialSeconds, setInitialSeconds] = useState<number>(
    Math.max(session.remaining, 1)
  );
  useEffect(() => {
    if (session.remaining > initialSeconds)
      setInitialSeconds(session.remaining);
    if (isIdle) setInitialSeconds(Math.max(session.remaining, 1));
  }, [session.remaining, initialSeconds, isIdle]);

  const fillRatio =
    initialSeconds > 0 ? 1 - session.remaining / initialSeconds : 0;

  const fillAnim = useRef(new Animated.Value(fillRatio)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillRatio,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [fillRatio, fillAnim]);

  const dashOffset = Animated.multiply(fillAnim, CIRC) as unknown as number;
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const handleStartOrResume = () => {
    setHasStarted(true);
    setInitialSeconds(Math.max(session.remaining, 1));
    resume();
  };
  const handlePause = () => pause();
  const handleReset = () => {
    reset();
    setHasStarted(false);
  };

  const sessionState: PomodoroSessionState = isIdle
    ? "idle"
    : isRunning
    ? "running"
    : "finished";
  const visualState = useMemo(
    () => POMODORO_STATES[sessionState],
    [sessionState]
  );

  const primaryAction = visualState.primary;
  const secondaryAction = visualState.secondary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: visualState.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: visualState.background }]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace("/(tabs)/Pomodoro/PomodoroConfigForm" as Href)
            }
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Feather name="chevron-left" size={24} color={WHITE} />
          </Pressable>
          <Text style={styles.headerTitle}>Pomodoro</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          {displaySubject ? (
            <Text style={styles.subject}>{displaySubject}</Text>
          ) : null}

          {/* Anillo y tempo  */}
          <View style={styles.ringWrapper}>
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            >
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                stroke={WHITE + "55"}
                strokeWidth={STROKE}
                fill="none"
              />
              {/* progre */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                stroke={WHITE}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} // empieza arriba
              />
            </Svg>

            <View style={styles.timeOverlay}>
              <Text style={styles.timer}>{time}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {isIdle && (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: primaryAction.color },
                  pressed && styles.btnPressed,
                ]}
                onPress={handleStartOrResume}
              >
                <Feather name="play" size={18} color={WHITE} />
                <Text style={[styles.btnText, { color: WHITE }]}>
                  {primaryAction.label}
                </Text>
              </Pressable>
            )}

            {isRunning && (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: primaryAction.color },
                  pressed && styles.btnPressed,
                ]}
                onPress={handlePause}
              >
                <Feather name="pause" size={18} color={WHITE} />
                <Text style={[styles.btnText, { color: WHITE }]}>
                  {primaryAction.label}
                </Text>
              </Pressable>
            )}

            {isPaused && (
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    { backgroundColor: primaryAction.color },
                    pressed && styles.btnPressed,
                    styles.btnHalf,
                  ]}
                  onPress={handleStartOrResume}
                >
                  <Feather name="play" size={18} color={WHITE} />
                  <Text style={[styles.btnText, { color: WHITE }]}>
                    {primaryAction.label}
                  </Text>
                </Pressable>

                {secondaryAction ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: secondaryAction.color },
                      pressed && styles.btnPressed,
                      styles.btnHalf,
                    ]}
                    onPress={handleReset}
                  >
                    <Feather name="square" size={18} color={SECONDARY_TEXT} />
                    <Text
                      style={[styles.btnText, { color: SECONDARY_TEXT }]}
                    >
                      {secondaryAction.label}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6, borderRadius: 10 },
  pressed: { opacity: 0.7 },
  headerTitle: {
    color: WHITE,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  subject: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
    opacity: 0.92,
  },

  ringWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  timeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: {
    color: WHITE,
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: 2,
  },

  actions: { width: "100%", paddingHorizontal: 8 },
  row: { flexDirection: "row", gap: 12 },

  btn: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnHalf: { flex: 1 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
