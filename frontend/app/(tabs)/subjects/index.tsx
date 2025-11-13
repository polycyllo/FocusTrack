import React, { useEffect, useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  Modal, 
} from "react-native";
import { useRouter, Href, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import {
  SubjectCardLayout,
  SUBJECT_CARD_COLORS,
  subjectCardStyles,
} from "@/components/cards/SubjectCardLayout";
import { usePomodoroStore } from "@/src/store/pomodoro.store";
import { useAuthStore } from "@/src/store/auth.store";
import UserProfileModal from "@/components/UserProfileModal";
import {
  deleteSubjectWithSchedules,
  getAllSubjectsWithSchedules,
} from "@/src/features/subjects/repo";
import { FORM_ICON_OPTIONS } from "@/src/constants/formStyles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type SubjectFromDB = {
  subjectId?: number;
  subject_id?: number;
  title: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
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

type SubjectWithSchedules = {
  subject: SubjectFromDB;
  schedules: ScheduleFromDB[];
};

type FilterKey = "todos" | "a-z" | "z-a" | "recientes" | "dia";

const DAY_OPTIONS = [
  { label: "Lunes", value: 0 },
  { label: "Martes", value: 1 },
  { label: "Miércoles", value: 2 },
  { label: "Jueves", value: 3 },
  { label: "Viernes", value: 4 },
  { label: "Sábado", value: 5 },
  { label: "Domingo", value: 6 },
] as const;

const TITLE_COLLATOR = new Intl.Collator("es", { sensitivity: "base" });

const getSubjectNumericId = (item: SubjectWithSchedules) =>
  item.subject.subjectId ?? item.subject.subject_id ?? 0;

const getSubjectTitle = (item: SubjectWithSchedules) =>
  (item.subject.title ?? "").trim();

function UserIcon({
  size = 24,
  color = "#fff",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M406.5 399.6C387.4 352.9 341.5 320 288 320l-64 0c-53.5 0-99.4 32.9-118.5 79.6-35.6-37.3-57.5-87.9-57.5-143.6 0-114.9 93.1-208 208-208s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3l64 0c38.8 0 71.2 27.6 78.5 64.3zM256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z" />
    </Svg>
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
  text: "#0A0A0A",
};

export default function SubjectsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [subjects, setSubjects] = useState<SubjectWithSchedules[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // ESTADO FILTROS
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("todos");
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);

  const applyFilterToData = useCallback(
    (data: SubjectWithSchedules[], filterKey: FilterKey, dayValue: number | null) => {
      if (!data.length) return [];
      const list = [...data];

      switch (filterKey) {
        case "a-z":
          return list.sort((a, b) =>
            TITLE_COLLATOR.compare(getSubjectTitle(a), getSubjectTitle(b))
          );
        case "z-a":
          return list.sort((a, b) =>
            TITLE_COLLATOR.compare(getSubjectTitle(b), getSubjectTitle(a))
          );
        case "recientes":
          return list.sort(
            (a, b) => getSubjectNumericId(b) - getSubjectNumericId(a)
          );
        case "dia":
          if (typeof dayValue !== "number") return list;
          return list
            .filter((item) =>
              (item.schedules ?? []).some((schedule) => schedule.day === dayValue)
            )
            .sort((a, b) =>
              TITLE_COLLATOR.compare(getSubjectTitle(a), getSubjectTitle(b))
            );
        case "todos":
        default:
          return list;
      }
    },
    []
  );

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSubjectsWithSchedules();
      setAllSubjects(data);
    } catch (error) {
      console.error("Error cargando materias:", error);
      Alert.alert("Error", "No se pudieron cargar las materias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  useEffect(() => {
    const effectiveFilter =
      selectedFilter === "dia" && dayFilter === null ? "todos" : selectedFilter;
    const effectiveDay = effectiveFilter === "dia" ? dayFilter : null;
    const prepared = applyFilterToData(allSubjects, effectiveFilter, effectiveDay);
    setSubjects(prepared);
  }, [allSubjects, selectedFilter, dayFilter, applyFilterToData]);

  const goCreate = () => router.push("/(tabs)/subjects/create" as Href);

  const handleUserIconPress = () => {
    if (isAuthenticated) {
      setProfileModalVisible(true);
    } else {
      router.push("/auth/login" as Href);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", `¿Deseas cerrar sesión como ${user?.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => {
          logout();
          Alert.alert("Sesión cerrada", "Has cerrado sesión exitosamente");
        },
      },
    ]);
  };

  const handleStatistics = () => {
    router.push("/(tabs)/statistics" as Href);
  };

  const handleAlarms = () => {
    router.push("/alarms" as Href);
  };

  const handleFilter = useCallback((filterKey: FilterKey, dayValue?: number | null) => {
    const normalizedDay =
      filterKey === "dia" && typeof dayValue === "number" ? dayValue : null;

    if (filterKey === "dia" && normalizedDay === null) {
      return;
    }

    const appliedFilter = filterKey === "dia" ? "dia" : filterKey;
    setSelectedFilter(appliedFilter);
    setDayFilter(appliedFilter === "dia" ? normalizedDay : null);
  }, []);

  const handleDaySelection = useCallback(
    (dayValue: number | null) => {
      setDayPickerVisible(false);
      if (dayValue === null) {
        handleFilter("todos");
        return;
      }

      handleFilter("dia", dayValue);
    },
    [handleFilter]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Materias</Text>
            {isAuthenticated && user && (
              <Text style={styles.userGreeting}>Hola, {user.name}</Text>
            )}
          </View>

          <View style={styles.headerButtons}>
            <Pressable
              onPress={goCreate}
              style={({ pressed }) => [
                styles.createBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.createBtnText}>+ Crear</Text>
            </Pressable>

            {/* botón filtros */}
            <Pressable
              onPress={() => setFilterModalVisible(true)}
              style={({ pressed }) => [
                styles.filterBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color="#fff" />
            </Pressable>

            <Pressable
              onPress={handleUserIconPress}
              style={({ pressed }) => [
                styles.userBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <UserIcon size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>Cargando...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyBody}>
            <Ionicons name="book-outline" size={64} color="rgba(0,0,0,0.3)" />
            <Text style={styles.emptyText}>No hay materias creadas</Text>
            <Text style={styles.emptySubtext}>
              Toca "+ Crear" para agregar tu primera materia
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            data={subjects}
            keyExtractor={(item) =>
              (item.subject.subjectId || item.subject.subject_id)?.toString() || ""
            }
            renderItem={({ item }) => (
              <SubjectCard item={item} onDeleted={loadSubjects} />
            )}
          />
        )}
      </View>

      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onLogout={handleLogout}
        onStatistics={handleStatistics}
        onAlarms={handleAlarms}
      />

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
                handleFilter("todos");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={22}
                color={selectedFilter === "todos" ? COLORS.header : COLORS.text}
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
                handleFilter("a-z");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="sort-alphabetical-ascending"
                size={22}
                color={selectedFilter === "a-z" ? COLORS.header : COLORS.text}
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
                handleFilter("z-a");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="sort-alphabetical-descending"
                size={22}
                color={selectedFilter === "z-a" ? COLORS.header : COLORS.text}
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
                handleFilter("recientes");
                setFilterModalVisible(false);
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={22}
                color={selectedFilter === "recientes" ? COLORS.header : COLORS.text}
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "recientes" && styles.filterOptionTextActive,
                ]}
              >
                Más recientes
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                selectedFilter === "dia" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setFilterModalVisible(false);
                setDayPickerVisible(true);
              }}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={22}
                color={selectedFilter === "dia" ? COLORS.header : COLORS.text}
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "dia" && styles.filterOptionTextActive,
                ]}
              >
                {dayFilter !== null
                  ? `Por día (${DAY_OPTIONS.find((d) => d.value === dayFilter)?.label ?? ""})`
                  : "Por día"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={dayPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDayPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDayPickerVisible(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Selecciona un día</Text>

            {DAY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.filterOption,
                  dayFilter === option.value && styles.filterOptionActive,
                ]}
                onPress={() => handleDaySelection(option.value)}
              >
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={22}
                  color={dayFilter === option.value ? COLORS.header : COLORS.text}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    dayFilter === option.value && styles.filterOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.filterOption}
              onPress={() => handleDaySelection(null)}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted-square"
                size={22}
                color={COLORS.text}
              />
              <Text style={styles.filterOptionText}>Mostrar todos</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
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

    Alert.alert(
      "Confirmar eliminación",
      `¿Eliminar la materia "${item.subject.title}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setDeleting(false),
        },
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
      ]
    );
  };

  const cancelDelete = () => setDeleting(false);

  const openPomodoroConfig = () => {
    if (subjectIdValue) {
      setSubject(subjectIdValue.toString());
      router.push({
        pathname: "/(tabs)/Pomodoro/PomodoroConfigForm" as Href,
        params: { returnTo: "/(tabs)/subjects" },
      });
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
      ? `${item.schedules.length} horario${item.schedules.length !== 1 ? "s" : ""}`
      : undefined;

  const iconKey = item.subject.icon || "book";
  const iconNode =
    FORM_ICON_OPTIONS.find((opt) => opt.key === iconKey)?.node ?? (
      <Ionicons name="book" size={18} color="#fff" />
    );

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
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
      </Pressable>

      <Pressable
        hitSlop={10}
        style={[
          subjectCardStyles.actionBtn,
          { backgroundColor: "#95a5a6", borderColor: "#95a5a6" },
        ]}
        onPress={cancelDelete}
      >
        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#fff" />
      </Pressable>
    </>
  ) : (
    <>
      <Pressable
        hitSlop={10}
        style={subjectCardStyles.actionBtn}
        onPress={openPomodoroConfig}
      >
        <MaterialCommunityIcons name="timer-plus-outline" size={18} color="#fff" />
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
      <SubjectCardLayout
        Component={Animated.View as any}
        containerProps={{ style: subjectCardStyles.card }}
        overlay={<Animated.View style={fillStyle} />}
        circleColor={item.subject.color || SUBJECT_CARD_COLORS.iconFallback}
        icon={iconNode}
        title={item.subject.title || "Sin nombre"}
        subtitle={subtitle}
        actions={actions}
      />
    </GestureDetector>
  );
}

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
    marginTop: 2,
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
  userBtn: {
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

  // FILTER STYLES
  filterBtn: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
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
    color: COLORS.text,
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
    borderColor: COLORS.header,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  filterOptionTextActive: {
    color: COLORS.header,
    fontWeight: "700",
  },
});
