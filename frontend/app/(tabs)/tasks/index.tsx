import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable } from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ListLayout } from "@/components/layouts/ListLayout";
import {
  SubjectCardLayout,
  SUBJECT_CARD_COLORS,
  subjectCardStyles,
} from "@/components/cards/SubjectCardLayout";
import { getTasksBySubject } from "@/src/features/tasks/repo";
import { FORM_ICON_OPTIONS } from "@/src/constants/formStyles";

type TaskRow = {
  taskId?: number | null;
  task_id?: number | null;
  title: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
};

const SCREEN_COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  action: "#70B1EA",
  emptyText: "#0A0A0A",
};

export default function TasksListScreen() {
  const router = useRouter();
  const { subjectId: subjectIdParam, subjectTitle } = useLocalSearchParams<{
    subjectId?: string;
    subjectTitle?: string;
  }>();
  const subjectId = subjectIdParam ? Number(subjectIdParam) : null;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const headerTitle = useMemo(
    () => (subjectTitle ? `Tareas · ${subjectTitle}` : "Tareas"),
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
      const rows = await getTasksBySubject(subjectId);
      setTasks(rows);
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

  return (
    <ListLayout
      title={headerTitle}
      actionLabel="+ Crear tarea"
      onActionPress={goCreate}
      data={tasks}
      loading={loading}
      renderItem={({ item }) => (
        <TaskCard item={item} subjectTitle={subjectTitle ?? ""} />
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
}: {
  item: TaskRow;
  subjectTitle?: string;
}) {
  const iconNode =
    FORM_ICON_OPTIONS.find((opt) => opt.key === item.icon)?.node ?? (
      <Ionicons name="checkbox-outline" size={20} color="#fff" />
    );

  const subtitle =
    item.description?.trim() ||
    (subjectTitle ? `Materia: ${subjectTitle}` : undefined);

  return (
    <SubjectCardLayout
      circleColor={item.color || SUBJECT_CARD_COLORS.iconFallback}
      icon={iconNode}
      title={item.title}
      subtitle={subtitle}
      actions={
        <>
          <Pressable style={subjectCardStyles.actionBtn} onPress={() => {}}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color="#fff"
            />
          </Pressable>
          <Pressable style={subjectCardStyles.actionBtn} onPress={() => {}}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color="#fff"
            />
          </Pressable>
        </>
      }
    />
  );
}
