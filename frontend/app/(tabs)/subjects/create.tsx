import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { ColorIconPicker } from "@/components/forms/ColorIconPicker";
import { addSubjectWithSchedules } from "@/src/features/subjects/repo";
import {
  FORM_THEME,
  FORM_COLOR_SWATCHES,
  FORM_ICON_OPTIONS,
} from "@/src/constants/formStyles";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_LABELS: Record<DayIndex, string> = {
  0: "L",
  1: "M",
  2: "M",
  3: "J",
  4: "V",
  5: "S",
  6: "D",
};

const NICE_DAY: Record<DayIndex, string> = {
  0: "Lunes",
  1: "Martes",
  2: "Miércoles",
  3: "Jueves",
  4: "Viernes",
  5: "Sábado",
  6: "Domingo",
};

const COLORS = FORM_THEME;
const COLOR_SWATCHES = FORM_COLOR_SWATCHES;
const ICON_OPTIONS = FORM_ICON_OPTIONS;

type TimeKind = "start" | "end";
type PickerState =
  | { open: true; day: DayIndex; kind: TimeKind }
  | { open: false };

export default function SubjectCreateScreen() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<DayIndex, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });
  const [times, setTimes] = useState<
    Record<DayIndex, { start?: Date; end?: Date }>
  >({ 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} });

  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].key);

  // time picker modal
  const [picker, setPicker] = useState<PickerState>({ open: false });

  const anyDaySelected = useMemo(
    () => Object.values(selectedDays).some(Boolean),
    [selectedDays]
  );

  // handlers
  const toggleDay = (d: DayIndex) =>
    setSelectedDays((prev) => ({ ...prev, [d]: !prev[d] }));

  const openPicker = (day: DayIndex, kind: TimeKind) =>
    setPicker({ open: true, day, kind });

  const onTimePicked = (_event: DateTimePickerEvent, date?: Date) => {
    if (!picker.open) return;
    const { day, kind } = picker;
    if (date) {
      setTimes((prev) => ({
        ...prev,
        [day]: { ...prev[day], [kind]: date },
      }));
    }
    setPicker({ open: false });
  };

  const formatTime = (d?: Date) =>
    d
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  const validate = () => {
    if (!name.trim()) return "El nombre es obligatorio.";
    if (!anyDaySelected) return "Selecciona al menos un día.";
    for (let di = 0 as DayIndex; di <= 6; di = (di + 1) as DayIndex) {
      if (selectedDays[di]) {
        const t = times[di];
        if (!t.start || !t.end) {
          return `Faltan horas para ${NICE_DAY[di]}.`;
        }
        if (t.start && t.end && t.end <= t.start) {
          return `La hora de fin debe ser mayor que la de inicio para ${NICE_DAY[di]}.`;
        }
      }
    }
    return null;
  };

  //CAMBIO: Función async para guardar en DB
  const onSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Revisa el formulario", error);
      return;
    }

    try {
      // Preparar schedules
      const schedules = Object.entries(selectedDays)
        .filter(([_, isOn]) => isOn)
        .map(([key]) => {
          const di = Number(key) as DayIndex;
          const t = times[di];
          return {
            day: di,
            start: t.start?.toISOString()!,
            end: t.end?.toISOString()!,
          };
        });

      // Guardar en la base de datos
      await addSubjectWithSchedules({
        title: name.trim(),
        description: null,
        color: color,
        schedules: schedules,
      });

      Alert.alert("Listo", "Materia creada exitosamente.");
      router.back();
    } catch (err) {
      console.error("Error al guardar materia:", err);
      Alert.alert("Error", "No se pudo guardar la materia.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Crear Materia</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la materia"
            placeholderTextColor="rgba(0,0,0,0.4)"
            style={styles.input}
          />
        </View>

        {/* Días */}
        <View style={styles.section}>
          <Text style={styles.label}>Días</Text>
          <View style={styles.daysRow}>
            {(Object.keys(DAY_LABELS) as unknown as DayIndex[]).map((di) => {
              const active = selectedDays[di];
              return (
                <Pressable
                  key={di}
                  onPress={() => toggleDay(di)}
                  style={[
                    styles.dayChip,
                    active ? styles.dayChipOn : styles.dayChipOff,
                  ]}
                >
                  <Text
                    style={[styles.dayChipText, active && { color: "#fff" }]}
                  >
                    {DAY_LABELS[di]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Horas por día seleccionado */}
        {anyDaySelected && (
          <View style={styles.section}>
            <Text style={styles.label}>Horas</Text>
            {(
              (Object.keys(DAY_LABELS) as unknown as DayIndex[]).filter(
                (d) => selectedDays[d]
              ) as DayIndex[]
            ).map((di) => {
              const t = times[di];
              return (
                <View key={`t-${di}`} style={styles.timeRow}>
                  <Text style={styles.timeRowDay}>{NICE_DAY[di]}</Text>

                  <View style={styles.timeButtons}>
                    <Pressable
                      onPress={() => openPicker(di, "start")}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="time" size={16} color="#333" />
                      <Text style={styles.timeBtnText}>
                        {formatTime(t.start)}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => openPicker(di, "end")}
                      style={styles.timeBtn}
                    >
                      <Ionicons name="time" size={16} color="#333" />
                      <Text style={styles.timeBtnText}>
                        {formatTime(t.end)}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <ColorIconPicker
          color={color}
          onColorChange={setColor}
          icon={icon}
          onIconChange={setIcon}
        />

        {/* Botones */}
        <View style={styles.footerBtns}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.btn,
              styles.btnCancel,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSave,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.btnText}>Guardar</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Time Picker (nativo) */}
      {picker.open && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={onTimePicked}
        />
      )}
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
  },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
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

  daysRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipOn: { backgroundColor: COLORS.chipOn },
  dayChipOff: { backgroundColor: COLORS.chipOff },
  dayChipText: { color: "#333", fontWeight: "700" },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  timeRowDay: { fontWeight: "600", color: COLORS.text },
  timeButtons: { flexDirection: "row", gap: 10 },
  timeBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 90,
    justifyContent: "center",
  },
  timeBtnText: { color: "#333", fontWeight: "600" },

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
