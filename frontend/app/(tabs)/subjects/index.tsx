import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { useRouter, Href, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePomodoroStore } from "@/src/store/pomodoro.store";
import {
  deleteSubjectWithSchedules,
  getAllSubjectsWithSchedules,
} from "@/src/features/subjects/repo";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// 👇 Tipo para las materias desde la DB
type SubjectFromDB = {
  subjectId?: number;
  subject_id?: number; // variante según la DB
  title: string;
  description?: string | null;
  color?: string | null;
};

type ScheduleFromDB = {
  scheduleId?: number;
  schedule_id?: number;
  startTime: string | null;
  start_time?: string | null;
  endTime: string | null;
  end_time?: string | null;
  day: number | null;
  status?: number | null;
  subjectId?: number;
  subject_id?: number;
};

export default function SubjectsScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<
    Array<{ subject: SubjectFromDB; schedules: ScheduleFromDB[] }>
  >([]);
  const [loading, setLoading] = useState(true);

  // 👇 Función para cargar materias desde la DB
  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await getAllSubjectsWithSchedules();
      setSubjects(data);
    } catch (error) {
      console.error("Error cargando materias:", error);
      Alert.alert("Error", "No se pudieron cargar las materias");
    } finally {
      setLoading(false);
    }
  };

  // 👇 Cargar al montar y cada vez que la pantalla reciba foco
  useEffect(() => {
    loadSubjects();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [])
  );

  const goCreate = () => router.push("/(tabs)/subjects/create" as Href);

  return (
    <ListLayout
      title="Materias"
      actionLabel="+ Crear materia"
      onActionPress={goCreate}
      data={subjects}
      loading={loading}
      renderItem={({ item }) => (
        <SubjectCard item={item} onDeleted={loadSubjects} />
      )}
      keyExtractor={(item) =>
        (item.subject.subjectId || item.subject.subject_id)?.toString() || ""
      }
      emptyMessage="No hay materias creadas"
      loadingMessage="Cargando..."
      colors={{
        background: COLORS.background,
        header: COLORS.header,
        action: COLORS.button,
        headerText: "#fff",
        actionText: "#fff",
        emptyText: "#0A0A0A",
      }}
      listProps={{
        contentContainerStyle: { padding: 12, paddingBottom: 20 },
      }}
    />
  );
}

function SubjectCard({ 
  item, 
  onDeleted 
}: { 
  item: { subject: SubjectFromDB; schedules: ScheduleFromDB[] };
  onDeleted: () => void;
}) {
  const setSubject = usePomodoroStore((s) => s.setSubject);
  const router = useRouter();

  const [deleting, setDeleting] = React.useState(false);

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

  const longPressGesture = Gesture.LongPress()
    .minDuration(1000)
    .onStart(() => {
      fillProgress.value = 0.01;
      fillOpacity.value = 1;
      fillProgress.value = withTiming(1, { duration: 1000 });
    })
    .onEnd((event, success) => {
      if (success) {
        runOnJS(setDeleting)(true);
        fillOpacity.value = withTiming(0, { duration: 300 });
      } else {
        cancelAnimation(fillProgress);
        fillOpacity.value = withTiming(0, { duration: 150 });
      }
    });

  const confirmDelete = async () => {
    const subjectId = item.subject.subjectId || item.subject.subject_id;

    Alert.alert("Confirmar eliminación", `¿Eliminar la materia "${item.subject.title}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => setDeleting(false) },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            if (subjectId) {
              await deleteSubjectWithSchedules(subjectId);
              Alert.alert("Éxito", "Materia eliminada");
              onDeleted();
            }
          },
        },
      ]
    );
  };

  const cancelDelete = () => setDeleting(false);

  const openPomodoroConfig = () => {
    const subjectId = item.subject.subjectId || item.subject.subject_id;
    if (subjectId) {
      setSubject(subjectId.toString());
      router.push("/(tabs)/Pomodoro/PomodoroConfigForm" as Href);
    }
  };

  const subtitle =
    item.schedules && item.schedules.length > 0
      ? `${item.schedules.length} horario${
          item.schedules.length !== 1 ? "s" : ""
        }`
      : undefined;

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.cardTitle}
            >
              {item.subject.title || "Sin nombre"}
            </Text>
            {item.schedules && item.schedules.length > 0 && (
              <Text style={styles.scheduleText}>
                {item.schedules.length} horario{item.schedules.length !== 1 ? "s" : ""}
              </Text>
            )}
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  userGreeting: { 
    color: "rgba(255,255,255,0.8)", 
    fontSize: 12, 
    marginTop: 2 
  },
  headerButtons: { flexDirection: "row", gap: 8, alignItems: "center" },
  createBtn: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  authBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 8,
  },
  emptyBody: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: { 
    color: "#0A0A0A", 
    fontSize: 16, 
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtext: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
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
  scheduleText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
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
