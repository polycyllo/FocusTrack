import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from "react-native";
import { useRouter, Href } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { ArrowBackButton } from "@/components/ArrowBackButton";
import { usePomodoroStore, PomodoroMode } from "@/src/store/pomodoro.store";
import { useSubjectsStore } from "@/src/store/subjects.store";

import type { PomodoroSessionState } from "@/constants/pomodoro";
import { POMODORO_STATES } from "@/constants/pomodoro";
import { playBell } from "@/src/utils/sounds";

const RING_SIZE = 260;
const STROKE = 8;
const R = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const WHITE = "#FFFFFF";
const SECONDARY_TEXT = "#0A0A0A";
const COMPLETION_BACKGROUND = "#E53935";

const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: "Tiempo de Enfoque",
  short: "Descanso Corto",
  long: "Descanso Largo",
};
export default function PomodoroScreen() {
  const router = useRouter();
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

  const handleGoBack = useCallback(() => {
    setShowCompletionOverlay(false);
    router.replace("/(tabs)/Pomodoro/PomodoroConfigForm" as Href);
  }, [router]);

  const session = usePomodoroStore((s) => s.session);
  const config = usePomodoroStore((s) => s.config);
  const cyclesPerRun = config.cycles || 1;
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
  const fullTimeForCurrentMode = useMemo(() => {
    if (session.mode === "focus") return config.focusTime * 60;
    if (session.mode === "short") return config.shortBreak * 60;
    if (session.mode === "long") return config.longBreak * 60;
    return 1;
  }, [session.mode, config]);

  const minutes = Math.floor(session.remaining / 60);
  const seconds = session.remaining % 60;
  const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;

  const [initialSeconds, setInitialSeconds] = useState<number>(
    Math.max(session.remaining, 1)
  );
  const prevMode = useRef(session.mode);
  const autoStartTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoStartSeconds, setAutoStartSeconds] = useState<number | null>(null);

  const clearAutoStartCountdown = useCallback(() => {
    if (autoStartTimer.current !== null) {
      clearInterval(autoStartTimer.current);
      autoStartTimer.current = null;
    }
    setAutoStartSeconds(null);
  }, []);

  const startAutoStartCountdown = useCallback(() => {
    clearAutoStartCountdown();
    setAutoStartSeconds(5);

    autoStartTimer.current = setInterval(() => {
      setAutoStartSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (autoStartTimer.current !== null) {
            clearInterval(autoStartTimer.current);
            autoStartTimer.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearAutoStartCountdown]);

  useEffect(() => {
    const previousMode = prevMode.current;
    const completedCycles =
      cyclesPerRun > 0 &&
      session.completedFocus !== 0 &&
      session.completedFocus % cyclesPerRun === 0;

    if (
      previousMode === "long" &&
      session.mode === "focus" &&
      completedCycles
    ) {
      setShowCompletionOverlay(true);
      setHasStarted(false);
      clearAutoStartCountdown();
      prevMode.current = session.mode;
      return;
    }

    if (showCompletionOverlay) {
      prevMode.current = session.mode;
      return;
    }

    const didReset = session.remaining === fullTimeForCurrentMode;

    if (session.mode !== previousMode) {
      if (hasStarted) {
        void playBell();
      }
      prevMode.current = session.mode;
      setInitialSeconds(Math.max(session.remaining, 1));
      clearAutoStartCountdown();
    } else if (didReset && session.remaining > 0) {
      setInitialSeconds(Math.max(session.remaining, 1));
    }
  }, [
    session.mode,
    session.remaining,
    fullTimeForCurrentMode,
    hasStarted,
    showCompletionOverlay,
    cyclesPerRun,
    clearAutoStartCountdown,
  ]);

  useEffect(() => {
    if (session.isRunning) {
      clearAutoStartCountdown();
    }
  }, [session.isRunning, clearAutoStartCountdown]);

  useEffect(() => {
    if (autoStartSeconds === 0) {
      setHasStarted(true);
      resume();
      setAutoStartSeconds(null);
    }
  }, [autoStartSeconds, resume]);

  useEffect(() => {
    return () => {
      clearAutoStartCountdown();
      setShowCompletionOverlay(false);
    };
  }, [clearAutoStartCountdown]);

  const fillRatio = useMemo(() => {
    if (initialSeconds <= 0) return 0;
    const ratio = 1 - session.remaining / initialSeconds;
    if (Number.isNaN(ratio)) return 0;
    return Math.min(1, Math.max(0, ratio));
  }, [initialSeconds, session.remaining]);

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
    clearAutoStartCountdown();
    setHasStarted(true);
    setShowCompletionOverlay(false);
    resume();
  };
  const handlePause = () => {
    clearAutoStartCountdown();
    pause();
  };
  const handleReset = () => {
    reset();
    setHasStarted(false);
    clearAutoStartCountdown();
    setShowCompletionOverlay(false);
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

  const composedBackground = showCompletionOverlay
    ? COMPLETION_BACKGROUND
    : visualState.background;

  const primaryAction = visualState.primary;
  const secondaryAction = visualState.secondary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: composedBackground }]}
    >
      <View style={[styles.container, { backgroundColor: composedBackground }]}>
        <View style={styles.header}>
          <ArrowBackButton
            onPress={handleGoBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          />
          <Text style={styles.headerTitle}>Pomodoro</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          {showCompletionOverlay ? (
            <View style={styles.completionWrapper}>
              <View style={styles.completionCircle}>
                <Text style={styles.completionText}>Sesión Terminada!</Text>
              </View>

              <View style={styles.completionActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.completionButton,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleGoBack}
                >
                  <Text style={styles.completionButtonText}>Volver</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {displaySubject ? (
                <Text style={styles.subject}>{displaySubject}</Text>
              ) : null}

              {autoStartSeconds !== null ? (
                <Text style={styles.autoStartCountdown}>
                  {autoStartSeconds}s
                </Text>
              ) : null}
              <View style={styles.statusContainer}>
                <Text style={styles.modeLabel}>
                  {MODE_LABELS[session.mode]}
                </Text>
                {session.mode === "focus" && (
                  <Text style={styles.cycleLabel}>
                    Ciclo: {session.completedFocus + 1} / {cyclesPerRun}
                  </Text>
                )}
              </View>
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
            </>
          )}
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
  autoStartCountdown: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "700",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 16, // Añade espacio antes del anillo
  },
  modeLabel: {
    color: WHITE,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: 0.95,
    textTransform: "uppercase",
  },
  cycleLabel: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "600",
    opacity: 0.8,
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
  completionWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 24,
  },
  completionCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
    borderColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COMPLETION_BACKGROUND,
  },
  completionText: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  completionActions: {
    width: "100%",
    alignItems: "center",
  },
  completionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: WHITE,
    alignItems: "center",
  },
  completionButtonText: {
    color: COMPLETION_BACKGROUND,
    fontWeight: "800",
    fontSize: 16,
  },
});
