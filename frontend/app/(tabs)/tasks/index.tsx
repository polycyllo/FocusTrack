import React from "react";
import { useRouter } from "expo-router";

import { ListLayout } from "@/components/layouts/ListLayout";

const COLORS = {
  background: "#9ECDF2",
  header: "#4A90E2",
  button: "#70B1EA",
  card: "#4A90E2",
  cardText: "#ffffff",
  subText: "rgba(255,255,255,0.7)",
  chipBg: "rgba(255,255,255,0.18)",
  chipBorder: "rgba(255,255,255,0.28)",
};

export default function TasksListScreen() {
  const router = useRouter();

  return (
    <ListLayout
      title="Tareas"
      actionLabel="+ Crear tarea"
      onActionPress={() => router.push("/(tabs)/tasks/create")}
      data={[]}
      loading={false}
      renderItem={() => null}
      keyExtractor={() => ""}
      emptyMessage="No hay tareas creadas"
      colors={{
        background: COLORS.background,
        header: COLORS.header,
        action: COLORS.button,
        headerText: "#fff",
        actionText: "#fff",
        emptyText: "#0A0A0A",
      }}
      listProps={{}}
    />
  );
}
