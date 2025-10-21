import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
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
import { toHHmm } from "../../src/utils/time";

const COLORS = {
  bg: "#D4F3EE",
  primary: "#237E7A",
  dark: "#0B2828",
  ok: "#34A853",
  danger: "#E53935",
  white: "#fff",
};

export default function AlarmForm() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{
    id?: string;
    type?: "subject" | "task" | "other";
  }>();
  const { getById, create, update, bootstrap } = useAlarms();

  const editing = !!id;
  const original = editing ? getById(id!) : undefined;

  const [title, setTitle] = useState(original?.title ?? "");
  const [alarmType, setAlarmType] = useState<"subject" | "task" | "other">(
    original?.type ?? (type as any) ?? "subject"
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

  const [tone, setTone] = useState<string>(original?.tone ?? "bell");
  const [vibration, setVibration] = useState<boolean>(
    original?.vibration ?? true
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload: AlarmInput = {
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
        times: repeatType === "custom" ? times : null,
        repeatDays: repeatType === "custom" ? repeatDays : null,
        tone,
        vibration,
        active: true,
      };
      let res: Alarm;
      if (editing) res = await update(id!, payload as any);
      else res = await create(payload);

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      setTimeout(() => {
        router.replace(`/alarms/${res.type}`);
      }, 300);
    } catch (e: any) {
      alert(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editing ? "Editar alarma" : "Crear alarma"}
      </Text>

      <Text style={styles.label}>Título:</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Título de la alarma"
        style={styles.input}
      />

      <Text style={styles.label}>Tipo de repetición:</Text>
      <RepeatTypeChips value={repeatType} onChange={setRepeatType} />

      {repeatType === "once" && (
        <>
          <Text style={styles.label}>Fecha en específico:</Text>
          <Pressable onPress={() => setShowDate(true)} style={styles.dateBtn}>
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>
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
          <Text style={styles.label}>Hora:</Text>
          <TimeRow value={time} onChange={setTime} />
        </>
      )}

      {repeatType === "daily" && (
        <>
          <Text style={styles.label}>Hora:</Text>
          <TimeRow value={time} onChange={setTime} />
        </>
      )}

      {repeatType === "custom" && (
        <>
          <Text style={styles.label}>Días:</Text>
          <DaySelector selected={repeatDays} onChange={setRepeatDays} />

          <Text style={[styles.label, { marginTop: 8 }]}>Horas:</Text>
          <MultiTimes values={times} onChange={setTimes} />
        </>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>Tono:</Text>
      <TonePicker value={tone} onChange={setTone} />

      <Text style={[styles.label, { marginTop: 12 }]}>Vibración:</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
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

      <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.btn, { backgroundColor: "#E53935" }]}
        >
          <Text style={styles.btnText}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          style={[styles.btn, { backgroundColor: "#34A853" }]}
        >
          <Text style={styles.btnText}>{editing ? "Guardar" : "Crear"}</Text>
        </Pressable>
      </View>

      <SaveToast visible={saved} />
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
  title: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 12,
  },
  label: { color: COLORS.dark, fontWeight: "700", marginTop: 8 },
  input: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cfe8e4",
    marginTop: 6,
  },

  dateBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 6,
  },

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

  btn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "800" },
});
