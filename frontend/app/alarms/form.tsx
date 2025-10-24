import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAlarms } from "../../src/store/alarm.store";
import { Alarm, AlarmInput } from "../../src/types/alarms";
import {
  RepeatTypeChips,
  DaySelector,
  TimeRow,
  MultiTimes,
  TonePicker,
  SaveToast,
} from "../../src/features/alarms/alarms.ui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DAYS } from "../../src/utils/time";

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  primaryDark: "#0B2828",
  dark: "#0B2828",
  ok: "#34A853",
  danger: "#E53935",
  white: "#fff",
  border: "#C8E7E3",
};

type DayMap = Record<string, string[]>;

export default function AlarmForm() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{
    id?: string;
    type?: "subject" | "task";
  }>();

  const { getById, create, update, bootstrap, hydrated } = useAlarms();

  const editing = !!id;
  const original = editing ? getById(id!) : undefined;

  const [title, setTitle] = useState(original?.title ?? "");
  const [alarmType, setAlarmType] = useState<"subject" | "task">(
    (original?.type as "subject" | "task") ??
      (type as "subject" | "task") ??
      "subject"
  );

  const [repeatType, setRepeatType] = useState<"once" | "daily" | "custom">(
    original?.repeatType ?? "daily"
  );
  const [date, setDate] = useState<Date | null>(
    original?.date ? new Date(original.date) : null
  );
  const [showDate, setShowDate] = useState(false);

  const [time, setTime] = useState<string>(original?.time ?? "08:00");
  const [times, setTimes] = useState<string[]>(original?.times ?? ["08:00"]);
  const [repeatDays, setRepeatDays] = useState<string[]>(
    original?.repeatDays ?? []
  );

  const originalMap = useMemo<DayMap | null>(() => {
    const m = (original as any)?.customByDay as DayMap | undefined;
    return m ?? null;
  }, [original]);

  const [perDay, setPerDay] = useState<boolean>(!!originalMap);
  const [customByDay, setCustomByDay] = useState<DayMap>(() => {
    if (originalMap) return structuredClone(originalMap);
    return {};
  });

  const [tone, setTone] = useState<string>(original?.tone ?? "bell");
  const [vibration, setVibration] = useState<boolean>(
    original?.vibration ?? true
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);
  useEffect(() => {
    if (!editing) return;
    if (!hydrated) return;
    const o = getById(id!);
    if (!o) return;

    setTitle(o.title ?? "");
    setAlarmType((o.type as any) ?? "subject");
    setRepeatType(o.repeatType ?? "daily");

    setDate(o.date ? new Date(o.date) : null);
    setTime(o.time ?? "08:00");
    setTimes(o.times ?? ["08:00"]);
    setRepeatDays(o.repeatDays ?? []);

    const map = (o as any).customByDay ?? null;
    setPerDay(!!map && Object.keys(map).length > 0);
    setCustomByDay(map ?? {});

    setTone(o.tone ?? "bell");
    setVibration(typeof o.vibration === "boolean" ? o.vibration : true);
  }, [editing, hydrated, id]);

  useEffect(() => {
    if (!perDay || repeatType !== "custom") return;
    setCustomByDay((prev) => {
      const next: DayMap = { ...prev };
      for (const d of repeatDays) {
        if (!next[d]) next[d] = ["08:00"];
      }
      for (const d of Object.keys(next)) {
        if (!repeatDays.includes(d)) delete next[d];
      }
      return next;
    });
  }, [repeatDays, perDay, repeatType]);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload: AlarmInput & { customByDay?: DayMap | null } = {
        title: title.trim() || "Alarma",
        type: alarmType,
        linkedId: null,
        repeatType,
        date:
          repeatType === "once"
            ? date
              ? date.toISOString().slice(0, 10)
              : null
            : null,
        time: repeatType !== "custom" ? time : null,
        times:
          repeatType === "custom" && !perDay
            ? times?.length
              ? times
              : null
            : null,
        repeatDays:
          repeatType === "custom" && !perDay
            ? repeatDays?.length
              ? repeatDays
              : null
            : null,
        tone,
        vibration,
        active: editing ? !!original?.active : true,
        customByDay:
          repeatType === "custom" && perDay
            ? Object.keys(customByDay).length
              ? customByDay
              : null
            : null,
      };

      let res: Alarm;
      if (editing) res = await update(id!, payload as any);
      else res = await create(payload);

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      setTimeout(() => {
        router.replace("/alarms");
      }, 300);
    } catch (e: any) {
      alert(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const CategorySelector = () => {
    const options = [
      { key: "subject", label: "Materia", icon: "book-open-variant" },
      { key: "task", label: "Tarea", icon: "file-document-outline" },
    ] as const;

    return (
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = alarmType === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setAlarmType(opt.key)}
              style={[styles.catChip, active && styles.catChipActive]}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={18}
                color={active ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[styles.catChipText, active && styles.catChipTextActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const PerDayToggle = () => {
    if (repeatType !== "custom") return null;
    return (
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Asignar horas por día</Text>
        <Pressable
          accessibilityRole="switch"
          onPress={() => setPerDay((v) => !v)}
          style={[styles.switch, perDay && styles.switchOn]}
        >
          <View style={[styles.knob, perDay && styles.knobOn]} />
        </Pressable>
      </View>
    );
  };

  const PerDayEditor = () => {
    if (!perDay || repeatType !== "custom") return null;

    const selectedDays = repeatDays.filter((d) => DAYS.includes(d as any));
    return (
      <View style={{ gap: 12, marginTop: 8 }}>
        {selectedDays.length === 0 ? (
          <Text style={{ color: COLORS.dark, opacity: 0.7 }}>
            Selecciona uno o más días para asignar horas.
          </Text>
        ) : null}

        {selectedDays.map((d) => {
          const arr = customByDay[d] ?? ["08:00"];
          return (
            <View key={d} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{d}</Text>
                <Text style={styles.daySub}>
                  {arr.length} {arr.length === 1 ? "hora" : "horas"}
                </Text>
              </View>
              <MultiTimes
                values={arr}
                onChange={(next) =>
                  setCustomByDay((prev) => ({ ...prev, [d]: next }))
                }
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {editing ? "Editar alarma" : "Crear alarma"}
      </Text>

      {/* Bloque 1: Categoría y título */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Categoría</Text>
        <CategorySelector />
        <Text style={styles.label}>Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título de la alarma"
          style={styles.input}
        />
      </View>

      {/* Bloque 2: Repetición */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Repetición</Text>
        <RepeatTypeChips value={repeatType} onChange={setRepeatType} />

        {repeatType === "once" && (
          <>
            <Text style={styles.label}>Fecha</Text>
            <Pressable
              onPress={() => setShowDate(true)}
              style={styles.btnPrimary}
            >
              <MaterialCommunityIcons
                name="calendar-month"
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.btnPrimaryText}>
                {date ? date.toISOString().slice(0, 10) : "Elegir fecha"}
              </Text>
            </Pressable>
            {showDate && (
              <DateTimePicker
                value={date ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onChange={(_, d) => {
                  setShowDate(false);
                  if (d) setDate(d);
                }}
              />
            )}
            <Text style={styles.label}>Hora</Text>
            <TimeRow value={time} onChange={setTime} />
          </>
        )}

        {repeatType === "daily" && (
          <>
            <Text style={styles.label}>Hora</Text>
            <TimeRow value={time} onChange={setTime} />
          </>
        )}

        {repeatType === "custom" && (
          <>
            <PerDayToggle />

            <Text style={styles.label}>Días</Text>
            <DaySelector selected={repeatDays} onChange={setRepeatDays} />

            {!perDay && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Horas</Text>
                <MultiTimes values={times} onChange={setTimes} />
              </>
            )}

            <PerDayEditor />
          </>
        )}
      </View>

      {/* Bloque 3: Notificación */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Notificación</Text>
        <Text style={styles.label}>Tono</Text>
        <TonePicker value={tone} onChange={setTone} />

        <Text style={[styles.label, { marginTop: 12 }]}>Vibración</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setVibration(true)}
            style={[styles.choice, vibration && styles.choiceActive]}
          >
            <Text
              style={[styles.choiceText, vibration && styles.choiceTextActive]}
            >
              Sí
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVibration(false)}
            style={[styles.choice, !vibration && styles.choiceActive]}
          >
            <Text
              style={[styles.choiceText, !vibration && styles.choiceTextActive]}
            >
              No
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Botones */}
      <View style={styles.btnRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
        >
          <Text style={styles.actionText}>Cancelar</Text>
        </Pressable>
        <Pressable
          disabled={saving}
          onPress={onSave}
          style={[styles.actionBtn, { backgroundColor: COLORS.ok }]}
        >
          <Text style={styles.actionText}>{editing ? "Guardar" : "Crear"}</Text>
        </Pressable>
      </View>

      <SaveToast visible={saved} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingTop: 40,
  },
  title: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 20,
    marginBottom: 12,
    textAlign: "center",
  },

  block: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  blockTitle: {
    fontWeight: "700",
    color: COLORS.primaryDark,
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    color: COLORS.dark,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F9FFFE",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },

  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { color: COLORS.primary, fontWeight: "600" },
  catChipTextActive: { color: COLORS.white },

  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: "700" },

  choice: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  choiceActive: { backgroundColor: COLORS.primary },
  choiceText: { color: COLORS.primary, fontWeight: "700" },
  choiceTextActive: { color: COLORS.white },

  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: { color: "#fff", fontWeight: "800" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#eef8f7",
    padding: 3,
  },
  switchOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  knobOn: {
    marginLeft: 48 - 22 - 3, // ancho - knob - padding
  },

  // Editor por día
  dayCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FAFEFD",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayTitle: { fontWeight: "800", color: COLORS.primaryDark, fontSize: 14 },
  daySub: { color: COLORS.dark, opacity: 0.7, fontSize: 12 },
});
