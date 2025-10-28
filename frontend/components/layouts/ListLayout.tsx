import React, { useMemo } from "react";
import {
  FlatList,
  FlatListProps,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ListLayoutColors = {
  background: string;
  header: string;
  headerText: string;
  action: string;
  actionText: string;
  emptyText: string;
};

const DEFAULT_COLORS: ListLayoutColors = {
  background: "#9ECDF2",
  header: "#4A90E2",
  headerText: "#ffffff",
  action: "#70B1EA",
  actionText: "#ffffff",
  emptyText: "#0A0A0A",
};

export type ListLayoutProps<T> = {
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  data: ReadonlyArray<T>;
  loading?: boolean;
  renderItem: FlatListProps<T>["renderItem"];
  keyExtractor: FlatListProps<T>["keyExtractor"];
  emptyMessage?: string;
  loadingMessage?: string;
  colors?: Partial<ListLayoutColors>;
  listProps?: Omit<FlatListProps<T>, "data" | "renderItem" | "keyExtractor">;
};

export function ListLayout<T>({
  title,
  actionLabel,
  onActionPress,
  data,
  loading = false,
  renderItem,
  keyExtractor,
  emptyMessage = "No hay registros",
  loadingMessage = "Cargando...",
  colors,
  listProps,
}: ListLayoutProps<T>) {
  const palette: ListLayoutColors = { ...DEFAULT_COLORS, ...colors };
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable
            onPress={onActionPress}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>{loadingMessage}</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          <FlatList
            {...listProps}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: ListLayoutColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    container: { flex: 1, backgroundColor: palette.background },
    header: {
      backgroundColor: palette.header,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: { color: palette.headerText, fontSize: 18, fontWeight: "600" },
    actionBtn: {
      backgroundColor: palette.action,
      borderColor: palette.action,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    pressed: { opacity: 0.85 },
    actionText: { color: palette.actionText, fontWeight: "600", fontSize: 12 },
    emptyBody: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: {
      color: palette.emptyText,
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
      paddingHorizontal: 24,
    },
  });

