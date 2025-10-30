import React, { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ColorIconPicker } from "@/components/forms/ColorIconPicker";
import {
  FORM_THEME,
  FORM_COLOR_SWATCHES,
  FORM_ICON_OPTIONS,
} from "@/src/constants/formStyles";
import { addTask } from "@/src/features/tasks/repo";

const COLORS = FORM_THEME;

export default function TaskCreateScreen() {
  const router = useRouter();
  const { subjectId: subjectIdParam, subjectTitle } = useLocalSearchParams<{
    subjectId?: string;
    subjectTitle?: string;
  }>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(FORM_COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(FORM_ICON_OPTIONS[0].key);
  const [saving, setSaving] = useState(false);
  const subjectId = subjectIdParam ? Number(subjectIdParam) : null;

  const onSave = async () => {
    if (!subjectId) {
      Alert.alert(
        "Materia requerida",
        "No se pudo identificar la materia asociada para esta tarea."
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert("Campo obligatorio", "El nombre de la tarea es requerido.");
      return;
    }

    const payload = {
      title: name.trim(),
      description: description.trim() ? description.trim() : null,
      color,
      icon,
      subjectId,
    };

    try {
      setSaving(true);
      await addTask(payload);

      setName("");
      setDescription("");
      setColor(FORM_COLOR_SWATCHES[0]);
      setIcon(FORM_ICON_OPTIONS[0].key);

      router.replace({
        pathname: "/(tabs)/tasks",
        params: {
          subjectId: subjectIdParam,
          subjectTitle: subjectTitle ?? "",
        },
      });
    } catch (error) {
      console.error("Error guardando tarea:", error);
      Alert.alert("Error", "No se pudo guardar la tarea. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>
          Crear Tarea{subjectTitle ? ` - ${subjectTitle}` : ""}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Nombre de la tarea"
            placeholderTextColor="rgba(0,0,0,0.4)"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Descripcion</Text>
          <TextInput
            placeholder="Descripcion de la tarea"
            placeholderTextColor="rgba(0,0,0,0.4)"
            style={[styles.input, styles.inputMultiline]}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <ColorIconPicker
          color={color}
          onColorChange={setColor}
          icon={icon}
          onIconChange={setIcon}
        />

        <View style={styles.footerBtns}>
          <Pressable
            style={[styles.btn, styles.btnCancel]}
            onPress={() =>
              router.replace({
                pathname: "/(tabs)/tasks",
                params: {
                  subjectId: subjectIdParam,
                  subjectTitle: subjectTitle ?? "",
                },
              })
            }
            disabled={saving}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnSave, saving && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.btnText}>
              {saving ? "Guardando..." : "Guardar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backBtn: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  footerBtns: { flexDirection: "row", gap: 12, marginBottom: 20 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancel: { backgroundColor: COLORS.red },
  btnSave: { backgroundColor: COLORS.green },
  btnText: { color: "#fff", fontWeight: "700" },
});
