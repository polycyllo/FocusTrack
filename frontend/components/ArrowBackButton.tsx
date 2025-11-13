import React from "react";
import { Pressable, StyleSheet } from "react-native";
import type {
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";

type IoniconName = keyof typeof Ionicons.glyphMap;

type ArrowBackButtonProps = Omit<PressableProps, "children" | "onPress"> & {
  onPress?: () => void;
  iconColor?: string;
  iconSize?: number;
  iconName?: IoniconName;
  fallbackHref?: Href;
  style?: PressableProps["style"];
};

export function ArrowBackButton({
  onPress,
  iconColor = "#fff",
  iconSize = 22,
  iconName = "arrow-back",
  fallbackHref,
  style,
  ...pressableProps
}: ArrowBackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackHref) {
      router.replace(fallbackHref);
    }
  };

  return (
    <Pressable
      {...pressableProps}
      style={(state) => resolveStyle(style, state)}
      onPress={handlePress}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
    borderRadius: 8,
  },
});

function resolveStyle(
  style: PressableProps["style"],
  state: PressableStateCallbackType
): StyleProp<ViewStyle> {
  const resolved = typeof style === "function" ? style(state) : style;
  return [styles.button, resolved];
}
