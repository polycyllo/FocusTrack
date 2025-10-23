import React, { ComponentType, ReactNode } from "react";
import { ViewProps } from "react-native";

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
};

export function CompletedTaskCardLayout({
  dimOpacity = 0.5,
  overlay,
  containerProps,
  ...rest
}: CompletedTaskCardLayoutProps) {
  const mergedContainerProps: CompletedTaskCardLayoutProps["containerProps"] = {
    ...containerProps,
    style: [containerProps?.style, { opacity: dimOpacity }],
  };

  return (
    <SubjectCardLayout
      {...rest}
      containerProps={mergedContainerProps}
      overlay={overlay}
    />
  );
}

export default CompletedTaskCardLayout;

