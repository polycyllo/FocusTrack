import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function SubjectCreateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva materia</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.closeBtnText}>Cerrar</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.helpText}>
          Aquí irá el formulario para: nombre, días, horas e ícono. ✨
        </Text>
      </View>
    </SafeAreaView>
  );
}

const COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  closeBtnText: { color: "#fff", fontWeight: "600" },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  helpText: { color: "#0A0A0A", textAlign: "center" },
});
