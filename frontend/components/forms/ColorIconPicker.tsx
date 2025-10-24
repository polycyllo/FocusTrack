import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import {
  FORM_THEME,
  FORM_COLOR_SWATCHES,
  FORM_ICON_OPTIONS,
} from "@/src/constants/formStyles";

type Props = {
  label?: string;
  color: string;
  onColorChange: (value: string) => void;
  icon: string;
  onIconChange: (value: string) => void;
  colorOptions?: string[];
  iconOptions?: typeof FORM_ICON_OPTIONS;
  showLabel?: boolean;
};

export function ColorIconPicker({
  label = "Color/icono",
  color,
  onColorChange,
  icon,
  onIconChange,
  colorOptions = FORM_COLOR_SWATCHES,
  iconOptions = FORM_ICON_OPTIONS,
  showLabel = true,
}: Props) {
  return (
    <View style={styles.section}>
      {showLabel && <Text style={styles.label}>{label}</Text>}
      <View style={styles.swatchRow}>
        {colorOptions.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => onColorChange(swatch)}
            style={[
              styles.swatch,
              { backgroundColor: swatch },
              color === swatch && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
      <View style={styles.iconRow}>
        {iconOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              styles.iconPick,
              icon === option.key && styles.iconPickOn,
            ]}
            onPress={() => onIconChange(option.key)}
          >
            {option.node}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: FORM_THEME.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: FORM_THEME.border,
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: "700", color: FORM_THEME.text },
  swatchRow: {
    flexDirection: "row",
    gap: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: "#000",
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconPick: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: FORM_THEME.border,
  },
  iconPickOn: {
    borderColor: "#000",
  },
});
