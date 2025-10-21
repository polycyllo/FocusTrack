import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAlarms } from "../../src/store/alarm.store";
import { Alarm } from "../../src/types/alarms";
import {
  AlarmCard,
  ConfirmDeleteModal,
  SaveToast,
} from "../../src/features/alarms/alarms.ui";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  bg: "#D4F3EE",
  card: "#5DC1B9",
  primary: "#237E7A",
  primaryDark: "#0B2828",
  dark: "#0B2828",
  white: "#fff",
  border: "rgba(0,0,0,0.08)",
};

type SectionKey = "subject" | "task" | "other";

type Section = {
  key: SectionKey;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

const SECTIONS: Section[] = [
  { key: "subject", icon: "book-open-variant", label: "Materias" },
  { key: "task", icon: "file-document-outline", label: "Tareas" },
  { key: "other", icon: "head-lightbulb-outline", label: "Otros" },
];

export default function AlarmHome() {
  const router = useRouter();
  const { bootstrap, listByType, toggleActive, remove, hydrated } = useAlarms();

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    subject: false,
    task: false,
    other: false,
  });

  const [toDelete, setToDelete] = useState<Alarm | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const onToggleOpen = (key: SectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSection = (s: Section) => {
    const expanded = open[s.key];
    const data = listByType(s.key) || [];

    return (
      <View key={s.key} style={styles.sectionWrap}>
        <Pressable onPress={() => onToggleOpen(s.key)} style={styles.block}>
          <MaterialCommunityIcons name={s.icon} size={26} color={COLORS.dark} />
          <Text style={styles.blockText}>{s.label}</Text>

          <View style={styles.counterPill}>
            <Text style={styles.counterText}>{data.length}</Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={COLORS.dark}
            style={{
              marginLeft: "auto",
              transform: [{ rotate: expanded ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>

        {expanded && (
          <View style={styles.contentBox}>
            {data.length === 0 ? (
              <Text style={styles.emptyText}>
                Sin alarmas en esta categoría.
              </Text>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={data}
                keyExtractor={(i) => i.id}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <AlarmCard
                    alarm={item}
                    onToggle={(act) => {
                      toggleActive(item.id, act).then(() => setSaved(true));
                      setTimeout(() => setSaved(false), 1100);
                    }}
                    onEdit={() =>
                      router.push({
                        pathname: "/alarms/form",
                        params: { id: item.id },
                      })
                    }
                    onDelete={() => setToDelete(item)}
                  />
                )}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {SECTIONS.map(renderSection)}

      <ConfirmDeleteModal
        visible={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          remove(toDelete.id).finally(() => setToDelete(null));
        }}
      />
      <SaveToast visible={saved} text="Actualizado" />
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

  sectionWrap: {
    marginTop: 12,
  },
  block: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  blockText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
  counterPill: {
    marginLeft: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  counterText: { color: COLORS.white, fontWeight: "700" },

  contentBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.dark, opacity: 0.7, padding: 6 },
});
