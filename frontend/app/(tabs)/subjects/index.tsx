import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSubjectsStore } from "@/src/store/subjects.store";
import type { Subject } from "@/src/store/subjects.store";
import { usePomodoroStore } from "@/src/store/pomodoro.store";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export default function SubjectsScreen() {
  const router = useRouter();
  const subjects = useSubjectsStore((s) => s.subjects);

  const goCreate = () => router.push("/(tabs)/subjects/create" as Href);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Materias</Text>

          <Pressable
            onPress={goCreate}
            style={({ pressed }) => [
              styles.createBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.createBtnText}>+ Crear materia</Text>
          </Pressable>
        </View>

        {/* Body */}
        {subjects.length === 0 ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>No hay materias creadas</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SubjectCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function SubjectCard({ item }: { item: Subject }) {
  const { removeSubject } = useSubjectsStore();
  const setSubject = usePomodoroStore((s) => s.setSubject);
  const router = useRouter();

  const [deleting, setDeleting] = React.useState(false);

  // Animación de llenado al mantener presionado
  const fillProgress = useSharedValue(0);
  const fillOpacity = useSharedValue(0);

  const fillStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.4)",
    transform: [{ scaleY: fillProgress.value }],
    opacity: fillOpacity.value,
  }));

  // 👇 Gestura: mantener presionado para activar borrado
  const longPressGesture = Gesture.LongPress()
    .minDuration(1000)
    .onStart(() => {
      fillProgress.value = 0.01;
      fillOpacity.value = 1;
      fillProgress.value = withTiming(1, { duration: 1000 });
    })
    .onEnd((event, success) => {
      if (success) {
        // 👇 Ejecutamos fuera del hilo de animación
        runOnJS(setDeleting)(true);
        fillOpacity.value = withTiming(0, { duration: 300 });
      } else {
        cancelAnimation(fillProgress);
        fillOpacity.value = withTiming(0, { duration: 150 });
      }
    });

  const confirmDelete = () => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Eliminar la materia "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeSubject(item.id),
        },
      ]
    );
  };

  const cancelDelete = () => setDeleting(false);

  const openPomodoroConfig = () => {
    setSubject(item.id);
    router.push("/(tabs)/Pomodoro/PomodoroConfigForm" as Href);
  };

  return (
    <GestureDetector gesture={longPressGesture}>
      <Animated.View style={styles.card}>
        {/* Relleno animado */}
        <Animated.View style={fillStyle} />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
          }}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: item.color || "#70B1EA" },
            ]}
          >
            {renderSubjectIcon(item.icon)}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.cardTitle}
            >
              {item.name}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {deleting ? (
            <>
              <Pressable
                hitSlop={10}
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#e74c3c", borderColor: "#e74c3c" },
                ]}
                onPress={confirmDelete}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>

              <Pressable
                hitSlop={10}
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#95a5a6", borderColor: "#95a5a6" },
                ]}
                onPress={cancelDelete}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                hitSlop={10}
                style={styles.actionBtn}
                onPress={openPomodoroConfig}
              >
                <MaterialCommunityIcons
                  name="timer-plus-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>

              <Pressable
                hitSlop={10}
                style={styles.actionBtn}
                onPress={() => {}}
              >
                <MaterialCommunityIcons
                  name="clipboard-check-multiple-outline"
                  size={18}
                  color="#fff"
                />
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function renderSubjectIcon(key: string) {
  switch (key) {
    case "book":
      return <Ionicons name="book" size={18} color="#fff" />;
    case "calculator":
      return <Ionicons name="calculator" size={18} color="#fff" />;
    case "flask":
      return <Ionicons name="flask" size={18} color="#fff" />;
    case "code-tags":
      return <MaterialCommunityIcons name="code-tags" size={18} color="#fff" />;
    default:
      return <Ionicons name="bookmark" size={18} color="#fff" />;
  }
}

const COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  button: "#70B1EA",
  card: "#4A90E2",
  cardText: "#ffffff",
  chipBg: "rgba(255,255,255,0.18)",
  chipBorder: "rgba(255,255,255,0.28)",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  createBtn: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  emptyBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
  },
  cardTitle: {
    color: COLORS.cardText,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 20,
  },
  actions: { flexDirection: "row", gap: 8, marginLeft: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
  },
});
