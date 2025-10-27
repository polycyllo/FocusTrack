import React, { ComponentType, useEffect, useCallback, useState } from "react";
import { Alert, Pressable, Text, ViewProps } from "react-native";
import { useRouter, Href, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ListLayout } from "@/components/layouts/ListLayout";
import {
  SubjectCardLayout,
  SUBJECT_CARD_COLORS,
  subjectCardStyles,
} from "@/components/cards/SubjectCardLayout";
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

const COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  button: "#70B1EA",
  card: "#4A90E2",
  cardText: "#ffffff",
  chipBg: "rgba(255,255,255,0.18)",
  chipBorder: "rgba(255,255,255,0.28)",
};

const AnimatedCardContainer = Animated.View as unknown as ComponentType<ViewProps>;

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
  onDeleted,
}: {
  item: { subject: SubjectFromDB; schedules: ScheduleFromDB[] };
  onDeleted: () => void;
}) {
  const setSubject = usePomodoroStore((s) => s.setSubject);
  const router = useRouter();

  const [deleting, setDeleting] = React.useState(false);

  const subjectIdValue = item.subject.subjectId ?? item.subject.subject_id;
  const subjectTitleValue = item.subject.title || "";

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
          } catch (error) {
            console.error("Error eliminando materia:", error);
            Alert.alert("Error", "No se pudo eliminar la materia");
          }
        },
      },
    ]);
  };

  const cancelDelete = () => setDeleting(false);

  const openPomodoroConfig = () => {
    if (subjectIdValue) {
      setSubject(subjectIdValue.toString());
      router.push("/(tabs)/Pomodoro/PomodoroConfigForm" as Href);
    }
  };

  const openSubjectTasks = () => {
    if (!subjectIdValue || deleting) return;
    router.push({
      pathname: "/(tabs)/tasks",
      params: {
        subjectId: String(subjectIdValue),
        subjectTitle: subjectTitleValue,
      },
    });
  };

  const subtitle =
    item.schedules && item.schedules.length > 0
      ? `${item.schedules.length} horario${
          item.schedules.length !== 1 ? "s" : ""
        }`
      : undefined;

  const actions = deleting ? (
    <>
      <Pressable
        hitSlop={10}
        style={[
          subjectCardStyles.actionBtn,
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
          subjectCardStyles.actionBtn,
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
        style={subjectCardStyles.actionBtn}
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
        style={subjectCardStyles.actionBtn}
        onPress={openSubjectTasks}
      >
        <MaterialCommunityIcons
          name="clipboard-check-multiple-outline"
          size={18}
          color="#fff"
        />
      </Pressable>
    </>
  );

  return (
    <GestureDetector gesture={longPressGesture}>
      <Pressable onPress={openSubjectTasks} disabled={deleting}>
        <SubjectCardLayout
          Component={AnimatedCardContainer}
          containerProps={{ style: subjectCardStyles.card }}
          overlay={<Animated.View pointerEvents="none" style={fillStyle} />}
          circleColor={item.subject.color || SUBJECT_CARD_COLORS.iconFallback}
          icon={<Ionicons name="book" size={18} color="#fff" />}
          title={item.subject.title || "Sin nombre"}
          subtitle={subtitle}
          actions={actions}
        />
      </Pressable>
    </GestureDetector>
  );
}
