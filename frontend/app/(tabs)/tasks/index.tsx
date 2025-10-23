import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ListLayout } from "@/components/layouts/ListLayout";
import {
  SubjectCardLayout,
  SUBJECT_CARD_COLORS,
  subjectCardStyles,
} from "@/components/cards/SubjectCardLayout";
import { CompletedTaskCardLayout } from "@/components/cards/CompletedTaskCardLayout";
import {
  getTasksBySubject,
  updateTaskStatus,
} from "@/src/features/tasks/repo";
import { usePomodoroStore } from "@/src/store/pomodoro.store";
import { FORM_ICON_OPTIONS } from "@/src/constants/formStyles";

type TaskRow = {
  taskId?: number | null;
  task_id?: number | null;
  title: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  status?: number | null;
  createdAt?: string | null;
  created_at?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
};

const getTaskNumericId = (row: TaskRow) => row.taskId ?? row.task_id ?? 0;

const parseDateToMs = (value?: string | null) => {
  if (!value) return 0;
  const isoCandidate = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const time = Date.parse(isoCandidate);
  return Number.isNaN(time) ? 0 : time;
};

const getCreatedTimestamp = (row: TaskRow) =>
  parseDateToMs(row.createdAt ?? row.created_at) || getTaskNumericId(row);

const getCompletedTimestamp = (row: TaskRow) =>
  parseDateToMs(row.completedAt ?? row.completed_at) || getCreatedTimestamp(row);

const SCREEN_COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  action: "#70B1EA",
  emptyText: "#0A0A0A",
};

export default function TasksListScreen() {
  const setSubject = usePomodoroStore((s) => s.setSubject);
  const router = useRouter();
  const { subjectId: subjectIdParam, subjectTitle } = useLocalSearchParams<{
    subjectId?: string;
    subjectTitle?: string;
  }>();

  const subjectId = subjectIdParam ? Number(subjectIdParam) : null;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const headerTitle = useMemo(
    () => (subjectTitle ? `Tareas - ${subjectTitle}` : "Tareas"),
    [subjectTitle]
  );

  const loadTasks = useCallback(async () => {
    if (!subjectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rows = (await getTasksBySubject(subjectId)) as TaskRow[];

      const pending = rows
        .filter((task) => task.status !== 1)
        .sort((a, b) => getCreatedTimestamp(b) - getCreatedTimestamp(a));

      const completed = rows
        .filter((task) => task.status === 1)
        .sort((a, b) => getCompletedTimestamp(b) - getCompletedTimestamp(a));

      setTasks([...pending, ...completed]);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      Alert.alert("Error", "No se pudieron cargar las tareas.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const goCreate = () => {
    if (!subjectIdParam) {
      Alert.alert(
        "Materia requerida",
        "Abre este listado desde una materia para crear tareas asociadas."
      );
      return;
    }

    router.push({
      pathname: "/(tabs)/tasks/create",
      params: {
        subjectId: subjectIdParam,
        subjectTitle: subjectTitle ?? "",
      },
    });
  };

  const openPomodoro = () => {
    if (!subjectId) {
      Alert.alert("Materia requerida", "No se pudo identificar la materia.");
      return;
    }
    setSubject(String(subjectId));
    router.push("/(tabs)/Pomodoro/PomodoroConfigForm");
  };

  const toggleTaskStatus = async (
    taskId: number,
    currentStatus?: number | null
  ) => {
    if (!taskId) return;
    try {
      const nextStatus: 0 | 1 = currentStatus === 1 ? 0 : 1;
      await updateTaskStatus(taskId, nextStatus);
      await loadTasks();
    } catch (error) {
      console.error("No se pudo actualizar la tarea:", error);
      Alert.alert("Error", "No se pudo actualizar el estado de la tarea.");
    }
  };

  return (
    <ListLayout
      title={headerTitle}
      actionLabel="+ Crear tarea"
      onActionPress={goCreate}
      data={tasks}
      loading={loading}
      renderItem={({ item }) => (
        <TaskCard
          item={item}
          subjectTitle={subjectTitle ?? ""}
          onOpenPomodoro={openPomodoro}
          onToggleStatus={toggleTaskStatus}
        />
      )}
      keyExtractor={(item, index) =>
        (item.taskId ?? item.task_id ?? index).toString()
      }
      emptyMessage={
        subjectTitle
          ? `No hay tareas para "${subjectTitle}".`
          : "Selecciona una materia para ver sus tareas."
      }
      colors={{
        background: SCREEN_COLORS.background,
        header: SCREEN_COLORS.header,
        action: SCREEN_COLORS.action,
        headerText: "#fff",
        actionText: "#fff",
        emptyText: SCREEN_COLORS.emptyText,
      }}
      listProps={{
        contentContainerStyle: { padding: 12, paddingBottom: 20 },
      }}
    />
  );
}

function TaskCard({
  item,
  subjectTitle,
  onOpenPomodoro,
  onToggleStatus,
}: {
  item: TaskRow;
  subjectTitle?: string;
  onOpenPomodoro: () => void;
  onToggleStatus: (taskId: number, status?: number | null) => void;
}) {
  const iconNode =
    FORM_ICON_OPTIONS.find((opt) => opt.key === item.icon)?.node ?? (
      <Ionicons name="checkbox-outline" size={20} color="#fff" />
    );

  const subtitle =
    item.description?.trim() ||
    (subjectTitle ? `Materia: ${subjectTitle}` : undefined);

  const id = item.taskId ?? item.task_id ?? 0;
  const completed = item.status === 1;

  const Layout = completed ? CompletedTaskCardLayout : SubjectCardLayout;

  return (
    <Layout
      circleColor={item.color || SUBJECT_CARD_COLORS.iconFallback}
      icon={iconNode}
      title={item.title}
      subtitle={subtitle}
      actions={
        <>
          <Pressable
            style={subjectCardStyles.actionBtn}
            onPress={onOpenPomodoro}
          >
            <MaterialCommunityIcons
              name="timer-plus-outline"
              size={18}
              color="#fff"
            />
          </Pressable>
          <Pressable
            style={taskCardStyles.checkboxButton}
            onPress={() => onToggleStatus(id, item.status)}
          >
            <View
              style={[
                taskCardStyles.checkboxSquare,
                completed && taskCardStyles.checkboxSquareCompleted,
              ]}
            >
              {completed ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : null}
            </View>
          </Pressable>
        </>
      }
    />
  );
}

const taskCardStyles = StyleSheet.create({
  checkboxButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C5CBD3",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareCompleted: {
    borderColor: "#27AE60",
    backgroundColor: "#27AE60",
  },
});
