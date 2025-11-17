import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  Modal,
  SafeAreaView,
  FlatList,
  Text,
  TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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

const truncateTitle = (value: string, maxLength: number) =>
  value.length > maxLength
    ? `${value.slice(0, maxLength).trimEnd()}...`
    : value;

type TaskFilterKey = "todos" | "a-z" | "z-a" | "recientes";

const TITLE_COLLATOR = new Intl.Collator("es", { sensitivity: "base" });

const sortByTitleAsc = (list: TaskRow[]) =>
  [...list].sort((a, b) =>
    TITLE_COLLATOR.compare((a.title ?? "").trim(), (b.title ?? "").trim())
  );

const sortByTitleDesc = (list: TaskRow[]) =>
  [...list].sort((a, b) =>
    TITLE_COLLATOR.compare((b.title ?? "").trim(), (a.title ?? "").trim())
  );

export default function TasksListScreen() {
  const setSubject = usePomodoroStore((s) => s.setSubject);
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const subjectIdParam = Array.isArray(params.subjectId) 
    ? params.subjectId[0] 
    : params.subjectId;
  const subjectTitle = Array.isArray(params.subjectTitle)
    ? params.subjectTitle[0]
    : params.subjectTitle;

  const subjectId = subjectIdParam ? Number(subjectIdParam) : null;

  const [rawTasks, setRawTasks] = useState<TaskRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilterKey>("todos");
  
  // Estado para búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  const headerTitle = useMemo(() => {
    const fullTitle = subjectTitle ? `Tareas - ${subjectTitle}` : "Tareas";
    return truncateTitle(fullTitle, 23);
  }, [subjectTitle]);

  const loadTasks = useCallback(async () => {
    if (!subjectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rows = (await getTasksBySubject(subjectId)) as TaskRow[];
      setRawTasks(rows);
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

  const applyFilterToTasks = useCallback(
    (rows: TaskRow[], filterKey: TaskFilterKey, search: string) => {
      if (!rows.length) return [];

      let pending = rows.filter((task) => task.status !== 1);
      let completed = rows.filter((task) => task.status === 1);

      // Aplicar búsqueda
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        pending = pending.filter((task) =>
          task.title.toLowerCase().includes(searchLower)
        );
        completed = completed.filter((task) =>
          task.title.toLowerCase().includes(searchLower)
        );
      }

      const sortByRecentPending = (list: TaskRow[]) =>
        [...list].sort((a, b) => getCreatedTimestamp(b) - getCreatedTimestamp(a));
      const sortByRecentCompleted = (list: TaskRow[]) =>
        [...list].sort((a, b) => getCompletedTimestamp(b) - getCompletedTimestamp(a));

      let sortedPending: TaskRow[] = pending;
      let sortedCompleted: TaskRow[] = completed;

      switch (filterKey) {
        case "a-z":
          sortedPending = sortByTitleAsc(pending);
          sortedCompleted = sortByTitleAsc(completed);
          break;
        case "z-a":
          sortedPending = sortByTitleDesc(pending);
          sortedCompleted = sortByTitleDesc(completed);
          break;
        case "recientes":
        case "todos":
        default:
          sortedPending = sortByRecentPending(pending);
          sortedCompleted =
            filterKey === "recientes"
              ? sortByRecentCompleted(completed)
              : sortByRecentCompleted(completed);
          break;
      }

      return [...sortedPending, ...sortedCompleted];
    },
    []
  );

  useEffect(() => {
    setTasks(applyFilterToTasks(rawTasks, selectedFilter, searchQuery));
  }, [rawTasks, selectedFilter, searchQuery, applyFilterToTasks]);

  const goCreate = () => {
    if (!subjectIdParam) {
      Alert.alert(
        "Materia requerida",
        "Abre este listado desde una materia para crear tareas asociadas."
      );
      return;
    }

    router.push({
      pathname: "/(tabs)/tasks/create" as any,
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
    router.push({
      pathname: "/(tabs)/Pomodoro/PomodoroConfigForm" as any,
      params: {
        returnTo: "/(tabs)/tasks",
        subjectId: subjectIdParam,
        subjectTitle: subjectTitle ?? "",
      },
    });
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

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
  };

  const emptyMessage = searchQuery.trim()
    ? `No se encontraron tareas con "${searchQuery}"`
    : subjectTitle
    ? `No hay tareas para "${subjectTitle}".`
    : "Selecciona una materia para ver sus tareas.";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header personalizado */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setFilterModalVisible(true)}
              style={({ pressed }) => [
                styles.filterBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={20}
                color="#fff"
              />
            </Pressable>

            <Pressable
              onPress={goCreate}
              style={({ pressed }) => [
                styles.createBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.createBtnText}>+ Crear</Text>
            </Pressable>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="rgba(0,0,0,0.5)"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} style={styles.clearBtn}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color="rgba(0,0,0,0.5)"
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>Cargando...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyBody}>
            <Ionicons name="checkbox-outline" size={64} color="rgba(0,0,0,0.3)" />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            data={tasks}
            keyExtractor={(item, index) =>
              (item.taskId ?? item.task_id ?? index).toString()
            }
            renderItem={({ item }) => (
              <TaskCard
                item={item}
                subjectTitle={subjectTitle ?? ""}
                onOpenPomodoro={openPomodoro}
                onToggleStatus={toggleTaskStatus}
              />
            )}
          />
        )}
      </View>

      {/* Modal de filtros */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Ordenar por</Text>

            <Pressable
              style={[
                styles.filterOption,
                selectedFilter === "todos" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setSelectedFilter("todos");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={22}
                color={
                  selectedFilter === "todos"
                    ? SCREEN_COLORS.header
                    : SCREEN_COLORS.emptyText
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "todos" && styles.filterOptionTextActive,
                ]}
              >
                Todos
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                selectedFilter === "a-z" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setSelectedFilter("a-z");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="sort-alphabetical-ascending"
                size={22}
                color={
                  selectedFilter === "a-z"
                    ? SCREEN_COLORS.header
                    : SCREEN_COLORS.emptyText
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "a-z" && styles.filterOptionTextActive,
                ]}
              >
                A a la Z
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                selectedFilter === "z-a" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setSelectedFilter("z-a");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="sort-alphabetical-descending"
                size={22}
                color={
                  selectedFilter === "z-a"
                    ? SCREEN_COLORS.header
                    : SCREEN_COLORS.emptyText
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "z-a" && styles.filterOptionTextActive,
                ]}
              >
                Z a la A
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                selectedFilter === "recientes" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setSelectedFilter("recientes");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={22}
                color={
                  selectedFilter === "recientes"
                    ? SCREEN_COLORS.header
                    : SCREEN_COLORS.emptyText
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "recientes" &&
                    styles.filterOptionTextActive,
                ]}
              >
                Más recientes
              </Text>
            </Pressable>

          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_COLORS.background },
  headerContainer: {
    backgroundColor: SCREEN_COLORS.header,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterBtn: {
    backgroundColor: SCREEN_COLORS.action,
    padding: 8,
    borderRadius: 10,
  },
  createBtn: {
    backgroundColor: SCREEN_COLORS.action,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  // Estilos para búsqueda
  searchContainer: {
    backgroundColor: SCREEN_COLORS.header,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0A0A0A",
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },

  container: {
    flex: 1,
    backgroundColor: SCREEN_COLORS.background,
  },
  emptyBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: SCREEN_COLORS.emptyText,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SCREEN_COLORS.emptyText,
    marginBottom: 16,
    textAlign: "center",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: SCREEN_COLORS.header,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: SCREEN_COLORS.emptyText,
  },
  filterOptionTextActive: {
    color: SCREEN_COLORS.header,
    fontWeight: "700",
  },
});