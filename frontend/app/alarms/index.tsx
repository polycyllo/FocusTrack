import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAlarms } from "../../src/store/alarm.store";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  dark: "#0B2828",
  white: "#fff",
};

const Block: React.FC<{ icon: any; text: string; onPress: () => void }> = ({
  icon,
  text,
  onPress,
}) => (
  <Pressable onPress={onPress} style={styles.block}>
    <MaterialCommunityIcons name={icon} size={28} color={COLORS.dark} />
    <Text style={styles.blockText}>{text}</Text>
    <MaterialCommunityIcons
      name="chevron-down"
      size={24}
      color={COLORS.dark}
      style={{ marginLeft: "auto" }}
    />
  </Pressable>
);

export default function AlarmHome() {
  const router = useRouter();
  const { bootstrap, hydrated } = useAlarms();

  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis alarmas</Text>
        <Pressable
          onPress={() => router.push("/alarms/form")}
          style={styles.createBtn}
        >
          <MaterialCommunityIcons name="plus" size={16} color={COLORS.white} />
          <Text style={styles.createText}>Crear alarma</Text>
        </Pressable>
      </View>

      <Block
        icon="book-open-variant"
        text="Materias"
        onPress={() => router.push("/alarms/subject")}
      />
      <Block
        icon="file-document-outline"
        text="Tareas"
        onPress={() => router.push("/alarms/task")}
      />
      <Block
        icon="head-lightbulb-outline"
        text="Otros"
        onPress={() => router.push("/alarms/other")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { color: COLORS.dark, fontWeight: "800", fontSize: 18 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createText: { color: COLORS.white, fontWeight: "700" },

  block: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  blockText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
