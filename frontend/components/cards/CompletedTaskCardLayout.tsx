import React, { ComponentType, ReactNode } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { SubjectCardLayout } from "./SubjectCardLayout";

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

type CompletedTaskCardLayoutProps = SubjectCardLayoutProps & {
  dimOpacity?: number; // default 0.5
  lineColor?: string; // default rgba(0,0,0,0.55)
  lineHeight?: number; // default 2
};

export function CompletedTaskCardLayout({
  dimOpacity = 0.5,
  lineColor = "rgba(0,0,0,0.55)",
  lineHeight = 2,
  overlay,
  containerProps,
  ...rest
}: CompletedTaskCardLayoutProps) {
  const lineOverlay = (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.overlayContainer]}
    >
      <View
        style={[
          styles.overlayLine,
          { backgroundColor: lineColor, height: lineHeight },
        ]}
      />
      {overlay}
    </View>
  );

  const mergedContainerProps: CompletedTaskCardLayoutProps["containerProps"] = {
    ...containerProps,
    style: [containerProps?.style, { opacity: dimOpacity }],
  };

  return (
    <SubjectCardLayout
      {...rest}
      containerProps={mergedContainerProps}
      overlay={lineOverlay}
    />
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    justifyContent: "center",
  },
  overlayLine: {
    // Extend across the card content, compensating for horizontal padding
    marginHorizontal: -12,
    borderRadius: 1,
  },
});

export default CompletedTaskCardLayout;

