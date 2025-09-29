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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// === NUEVO: importar el store para guardar ===
import { useSubjectsStore } from "@/src/store/subjects.store";
import type { Subject } from "@/src/store/subjects.store";

//nota: Buscar la manera de que cuando me equivoque al seleccionar la hora de un dia al
//hacer clic otra vez sobre el dia reestablecer las hroas lo mismo para el nombre
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

const COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  card: "#E5F2FD",
  text: "#0A0A0A",
  chipOn: "#2D6CDF",
  chipOff: "rgba(0,0,0,0.08)",
  border: "rgba(0,0,0,0.12)",
  red: "#E74C3C",
  green: "#27AE60",
};
// Modificar forma en la que esta ordenado no olvidarmeeee, definir que colores e iconos tendremos
const COLOR_SWATCHES = ["#3567e7", "#e74c3c", "#f39c12", "#27ae60", "#8e44ad"];
const ICON_OPTIONS = [
  { key: "book", node: <Ionicons name="book" size={22} /> },
  { key: "calculator", node: <Ionicons name="calculator" size={22} /> },
  { key: "flask", node: <Ionicons name="flask" size={22} /> },
  {
    key: "code-tags",
    node: <MaterialCommunityIcons name="code-tags" size={22} />,
  },
];

type TimeKind = "start" | "end";
type PickerState =
  | { open: true; day: DayIndex; kind: TimeKind }
  | { open: false };

export default function SubjectCreateScreen() {
  const router = useRouter();

  // === NUEVO: acción del store ===
  const addSubject = useSubjectsStore((s) => s.addSubject);

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
        // === NUEVO: fin > inicio ===
        if (t.start && t.end && t.end <= t.start) {
          return `La hora de fin debe ser mayor que la de inicio para ${NICE_DAY[di]}.`;
        }
      }
    }
    return null;
  };

  const onSave = () => {
    const error = validate();
    if (error) {
      Alert.alert("Revisa el formulario", error);
      return;
    }

    // base del payload igual a tu versión
    const base = {
      name: name.trim(),
      color,
      icon,
      schedule: Object.entries(selectedDays)
        .filter(([_, isOn]) => isOn)
        .map(([key]) => {
          const di = Number(key) as DayIndex;
          const t = times[di];
          return {
            day: di,
            start: t.start?.toISOString()!, // validado arriba
            end: t.end?.toISOString()!,
          };
        }),
    };

    // === NUEVO: id + createdAt y guardado en store ===
    const id = `sub_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    const subject: Subject = { id, createdAt, ...base };

    addSubject(subject); // persistido en AsyncStorage por el store

    Alert.alert("Listo", "Materia creada.");
    router.back(); // regresa a la lista de Materias
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

        {/* Color / ícono */}
        <View style={styles.section}>
          <Text style={styles.label}>Color / ícono</Text>

          <View style={styles.rowBetween}>
            {/* Colores */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {COLOR_SWATCHES.map((c) => {
                const selected = color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: c,
                        borderColor: selected ? "#000" : "transparent",
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Iconos */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {ICON_OPTIONS.map((opt) => {
                const selected = icon === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setIcon(opt.key)}
                    style={[styles.iconPick, selected && styles.iconPickOn]}
                  >
                    <Text>{opt.node}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

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

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  swatch: {
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 2,
  },
  iconPick: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconPickOn: {
    borderColor: "#000",
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
