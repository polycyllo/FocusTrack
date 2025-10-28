import React from "react";
import { Stack } from "expo-router";
import { AlarmsProvider } from "../../src/store/alarm.store";

export default function Layout() {
  return (
    <AlarmsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AlarmsProvider>
  );
}
