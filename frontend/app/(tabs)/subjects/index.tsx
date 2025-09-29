import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSubjectsStore, Subject } from "@/src/store/subjects.store";

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
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: item.color || "#70B1EA" },
        ]}
      >
        {renderSubjectIcon(item.icon)}
      </View>

      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.cardTitle}>
          {item.name}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable hitSlop={10} style={styles.actionBtn} onPress={() => {}}>
          <MaterialCommunityIcons
            name="timer-plus-outline"
            size={18}
            color="#fff"
          />
        </Pressable>

        <Pressable hitSlop={10} style={styles.actionBtn} onPress={() => {}}>
          <MaterialCommunityIcons
            name="clipboard-check-multiple-outline"
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
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
    gap: 12,
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
