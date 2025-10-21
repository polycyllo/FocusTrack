import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAlarms } from "../../src/store/alarm.store";
import {
  AlarmCard,
  ConfirmDeleteModal,
  SaveToast,
} from "../../src/features/alarms/alarms.ui";
import { Alarm } from "../../src/types/alarms";

const COLORS = { bg: "#D4F3EE", dark: "#0B2828" };

export default function ListByType() {
  const { type } = useLocalSearchParams<{
    type: "subject" | "task" | "other";
  }>();
  const router = useRouter();
  const { listByType, toggleActive, remove, bootstrap } = useAlarms();
  const [toDelete, setToDelete] = useState<Alarm | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const data = listByType(type ?? "subject");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 16,
        paddingTop: 40,
      }}
    >
      <Text
        style={{
          fontWeight: "800",
          color: COLORS.dark,
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        {type === "subject" ? "Materias" : type === "task" ? "Tareas" : "Otros"}
      </Text>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onToggle={(act) => {
              toggleActive(item.id, act).then(() => setSaved(true));
              setTimeout(() => setSaved(false), 1200);
            }}
            onEdit={() =>
              router.push({ pathname: "/alarms/form", params: { id: item.id } })
            }
            onDelete={() => setToDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: COLORS.dark, opacity: 0.7 }}>
            Sin alarmas en esta categoría.
          </Text>
        }
      />

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
