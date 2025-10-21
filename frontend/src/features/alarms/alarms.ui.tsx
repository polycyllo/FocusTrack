import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { TONES } from "./tones.catalog";
import { Alarm } from "../../types/alarms";
import { DAYS, DAY_LABEL, toHHmm } from "../../utils/time";

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  primaryDark: "#0B2828",
  ok: "#34A853",
  danger: "#E53935",
  text: "#0B2828",
  white: "#fff",
};

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Text
    style={{
      fontWeight: "700",
      fontSize: 16,
      color: COLORS.text,
      marginBottom: 6,
    }}
  >
    {children}
  </Text>
);

/* -------------------- AlarmCard -------------------- */
export const AlarmCard: React.FC<{
  alarm: Alarm;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ alarm, onToggle, onEdit, onDelete }) => {
  const isActive = alarm.active;
  const iconName = isActive ? "bell" : "bell-outline";
  const sub =
    alarm.repeatType === "custom"
      ? `Repite: ${(alarm.repeatDays ?? []).map((d) => DAY_LABEL[d]).join("-")}`
      : `Repite: ${alarm.repeatType === "daily" ? "Diario" : "Única vez"}`;

  const displayTime = alarm.time ?? alarm.times?.[0] ?? "--:--";

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onToggle(!isActive)}
        style={{ paddingRight: 10 }}
      >
        <MaterialCommunityIcons
          name={isActive ? "bell-ring" : iconName}
          size={26}
          color={COLORS.primaryDark}
        />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>
          {displayTime} — {alarm.title}
        </Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <Pressable onPress={onEdit} style={{ paddingHorizontal: 8 }}>
        <MaterialCommunityIcons
          name="clock-edit"
          size={22}
          color={COLORS.primaryDark}
        />
      </Pressable>
      <Pressable onPress={onDelete} style={{ paddingLeft: 8 }}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={22}
          color={COLORS.danger}
        />
      </Pressable>
    </View>
  );
};

/* -------------------- RepeatTypeChips -------------------- */
export const RepeatTypeChips: React.FC<{
  value: "once" | "daily" | "custom";
  onChange: (v: "once" | "daily" | "custom") => void;
}> = ({ value, onChange }) => {
  const Chip = (v: any, label: string) => (
    <Pressable
      onPress={() => onChange(v)}
      style={[styles.chip, value === v && styles.chipActive]}
    >
      <Text style={[styles.chipText, value === v && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View style={styles.chipsRow}>
      {Chip("once", "Una vez")}
      {Chip("daily", "Diaria")}
      {Chip("custom", "Personalizada")}
    </View>
  );
};

/* -------------------- DaySelector -------------------- */
export const DaySelector: React.FC<{
  selected: string[];
  onChange: (days: string[]) => void;
}> = ({ selected, onChange }) => {
  return (
    <View style={styles.chipsRow}>
      {DAYS.map((d) => {
        const active = selected.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => {
              const next = active
                ? selected.filter((x) => x !== d)
                : [...selected, d];
              onChange(next);
            }}
            style={[styles.day, active && styles.dayActive]}
          >
            <Text style={[styles.dayText, active && styles.dayTextActive]}>
              {d}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/* -------------------- TimeRow (1 hora) -------------------- */
export const TimeRow: React.FC<{
  value: string;
  onChange: (hhmm: string) => void;
}> = ({ value, onChange }) => {
  const [show, setShow] = useState(false);
  const date = useMemo(() => {
    const [h, m] = value?.split(":") ?? ["08", "00"];
    const d = new Date();
    d.setHours(Number(h));
    d.setMinutes(Number(m));
    d.setSeconds(0);
    return d;
  }, [value]);

  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeValue}>{value}</Text>
      <Pressable onPress={() => setShow(true)} style={styles.timeBtn}>
        <MaterialCommunityIcons
          name="clock-time-four-outline"
          size={20}
          color={COLORS.white}
        />
        <Text style={styles.timeBtnText}>Cambiar</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          onChange={(_, d) => {
            setShow(false);
            if (!d) return;
            onChange(toHHmm(d));
          }}
        />
      )}
    </View>
  );
};

/* -------------------- MultiTimes (varias horas) -------------------- */
export const MultiTimes: React.FC<{
  values: string[];
  onChange: (times: string[]) => void;
}> = ({ values, onChange }) => {
  const addOne = () => onChange([...(values || []), "08:00"]);
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <View style={{ gap: 8 }}>
      {(values ?? []).map((t, idx) => (
        <View key={`${t}-${idx}`} style={styles.multitimeRow}>
          <TimeRow
            value={t}
            onChange={(v) => {
              const next = [...values];
              next[idx] = v;
              onChange(next);
            }}
          />
          <Pressable onPress={() => remove(idx)} style={styles.removeBtn}>
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={COLORS.white}
            />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addOne} style={styles.addBtn}>
        <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Agregar hora</Text>
      </Pressable>
    </View>
  );
};

/* -------------------- TonePicker -------------------- */
export const TonePicker: React.FC<{
  value: string;
  onChange: (toneKey: string) => void;
}> = ({ value, onChange }) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  const safePlay = async (key: string) => {
    try {
      const tone = TONES.find((t) => t.key === key);
      if (!tone?.file) return;
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(tone.file);
      soundRef.current = sound;
      const status = (await sound.playAsync()) as AVPlaybackStatusSuccess;
    } catch (e) {
      // si falta archivo, no romper
    }
  };

  return (
    <View style={styles.toneRow}>
      <FlatList
        horizontal
        data={TONES}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ gap: 8 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          // ignora items sin archivo disponible
          if (!item.file) return null;
          const active = item.key === value;
          return (
            <Pressable
              onPress={() => onChange(item.key)}
              style={[styles.toneChip, active && styles.toneChipActive]}
            >
              <Text
                style={[
                  styles.toneChipText,
                  active && styles.toneChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
      <Pressable onPress={() => safePlay(value)} style={styles.previewBtn}>
        <MaterialCommunityIcons name="play" size={16} color={COLORS.white} />
        <Text style={styles.previewText}>Probar</Text>
      </Pressable>
    </View>
  );
};

/* -------------------- ConfirmDeleteModal -------------------- */
export const ConfirmDeleteModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ visible, onCancel, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalWrap}>
      <View style={styles.modalBox}>
        <Text style={{ color: COLORS.white, fontSize: 16, marginBottom: 12 }}>
          ¿Deseas eliminar esta alarma?
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={onCancel}
            style={[styles.modalBtn, { backgroundColor: COLORS.danger }]}
          >
            <Text style={styles.modalBtnText}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.modalBtn, { backgroundColor: COLORS.ok }]}
          >
            <Text style={styles.modalBtnText}>Confirmar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

/* -------------------- SaveToast -------------------- */
export const SaveToast: React.FC<{ visible: boolean; text?: string }> = ({
  visible,
  text = "Alarma guardada correctamente",
}) => {
  if (!visible) return null;
  return (
    <View style={styles.toast}>
      <Text style={{ color: COLORS.white }}>{text} ✅</Text>
    </View>
  );
};

/* -------------------- styles -------------------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: { fontWeight: "700", color: COLORS.white, fontSize: 15 },
  cardSub: { color: COLORS.white, opacity: 0.9, marginTop: 3 },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.primary, fontWeight: "600" },
  chipTextActive: { color: COLORS.white },

  day: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: COLORS.primary },
  dayText: { color: COLORS.primary, fontWeight: "700" },
  dayTextActive: { color: COLORS.white },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeValue: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeBtnText: { color: COLORS.white, fontWeight: "600" },

  multitimeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: { backgroundColor: COLORS.danger, padding: 8, borderRadius: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: "600" },

  toneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  toneChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  toneChipActive: { backgroundColor: COLORS.primary },
  toneChipText: { color: COLORS.primary, fontWeight: "600" },
  toneChipTextActive: { color: COLORS.white },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewText: { color: COLORS.white },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    width: "80%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: { color: COLORS.white, fontWeight: "700" },

  toast: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
