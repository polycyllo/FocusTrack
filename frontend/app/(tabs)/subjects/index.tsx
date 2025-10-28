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
import Svg, { Path } from "react-native-svg";
import { usePomodoroStore } from "@/src/store/pomodoro.store";
import { useAuthStore } from "@/src/store/auth.store";
import UserProfileModal from "@/components/UserProfileModal";
import { 
  deleteSubjectWithSchedules, 
  getAllSubjectsWithSchedules 
} from "@/src/features/subjects/repo";
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

function UserIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M406.5 399.6C387.4 352.9 341.5 320 288 320l-64 0c-53.5 0-99.4 32.9-118.5 79.6-35.6-37.3-57.5-87.9-57.5-143.6 0-114.9 93.1-208 208-208s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3l64 0c38.8 0 71.2 27.6 78.5 64.3zM256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z" />
    </Svg>
  );
}

export default function SubjectsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [subjects, setSubjects] = useState<Array<{ subject: SubjectFromDB; schedules: ScheduleFromDB[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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

  useEffect(() => {
    loadSubjects();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [])
  );

  const goCreate = () => router.push("/(tabs)/subjects/create" as Href);

  const handleUserIconPress = () => {
    if (isAuthenticated) {
      setProfileModalVisible(true);
    } else {
      router.push("/auth/login" as Href);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      `¿Deseas cerrar sesión como ${user?.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            logout();
            Alert.alert("Sesión cerrada", "Has cerrado sesión exitosamente");
          },
        },
      ]
    );
  };

  const handleStatistics = () => {
    // Navegar a pantalla de estadísticas
    Alert.alert("Implementar Estadísticas", "Aquí implementariamos las estadísticas del usuario");
  };

  const handleAlarms = () => {
    // Navegar a la pantalla de alarmas kike
    Alert.alert("Aquí Alarmas", "Aquí ya ves como redireccionar a las alarmas kike");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
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

            {/* Botón de usuario con icono SVG */}
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

        {/* Body */}
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

      {/* Modal de perfil de usuario */}
      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onLogout={handleLogout}
        onStatistics={handleStatistics}
        onAlarms={handleAlarms}
      />
    </SafeAreaView>
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
    
    Alert.alert(
      "Confirmar eliminación",
      `¿Eliminar la materia "${item.subject.title}"?`,
      [
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

  return (
    <GestureDetector gesture={longPressGesture}>
      <Animated.View style={styles.card}>
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
              { backgroundColor: item.subject.color || "#70B1EA" },
            ]}
          >
            <Ionicons name="book" size={18} color="#fff" />
          </View>

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