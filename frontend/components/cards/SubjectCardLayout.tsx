import React, { ComponentType, ReactNode } from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";

export const SUBJECT_CARD_COLORS = {
  card: "#4A90E2",
  iconFallback: "#70B1EA",
  cardText: "#ffffff",
  subtitle: "rgba(255,255,255,0.7)",
  chipBorder: "rgba(255,255,255,0.28)",
  chipBg: "rgba(255,255,255,0.18)",
};

type SubjectCardLayoutProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  circleColor?: string | null;
  actions: ReactNode;
  cardColor?: string;
  Component?: ComponentType<ViewProps>;
  containerProps?: Omit<ViewProps, "style"> & { style?: ViewProps["style"] };
  overlay?: ReactNode;
};

export function SubjectCardLayout({
  title,
  subtitle,
  icon,
  circleColor,
  actions,
  cardColor,
  Component = View,
  containerProps,
  overlay,
}: SubjectCardLayoutProps) {
  const mergedStyle = [
    subjectCardStyles.card,
    cardColor ? { backgroundColor: cardColor } : null,
    containerProps?.style,
  ];

  return (
    <Component {...containerProps} style={mergedStyle}>
      {overlay}
      <View style={subjectCardStyles.left}>
        <View
          style={[
            subjectCardStyles.iconCircle,
            circleColor ? { backgroundColor: circleColor } : null,
          ]}
        >
          {icon}
        </View>
        <View style={subjectCardStyles.texts}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={subjectCardStyles.cardTitle}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={subjectCardStyles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={subjectCardStyles.actions}>{actions}</View>
    </Component>
  );
}

export const subjectCardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SUBJECT_CARD_COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: SUBJECT_CARD_COLORS.chipBorder,
    backgroundColor: SUBJECT_CARD_COLORS.iconFallback,
  },
  texts: {
    flex: 1,
  },
  cardTitle: {
    color: SUBJECT_CARD_COLORS.cardText,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    color: SUBJECT_CARD_COLORS.subtitle,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SUBJECT_CARD_COLORS.chipBg,
    borderWidth: 1,
    borderColor: SUBJECT_CARD_COLORS.chipBorder,
  },
});
