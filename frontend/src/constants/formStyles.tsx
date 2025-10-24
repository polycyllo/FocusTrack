import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export const FORM_THEME = {
  background: "#9ECDF2",
  header: "#4A90E2",
  card: "#E5F2FD",
  text: "#0A0A0A",
  chipOn: "#2D6CDF",
  chipOff: "rgba(0,0,0,0.08)",
  border: "rgba(0,0,0,0.12)",
  red: "#E74C3C",
  green: "#27AE60",
};

export const FORM_COLOR_SWATCHES = [
  "#3567e7",
  "#e74c3c",
  "#f39c12",
  "#27ae60",
  "#8e44ad",
];

export const FORM_ICON_OPTIONS = [
  { key: "book", node: <Ionicons name="book" size={22} /> },
  { key: "calculator", node: <Ionicons name="calculator" size={22} /> },
  { key: "flask", node: <Ionicons name="flask" size={22} /> },
  {
    key: "code-tags",
    node: <MaterialCommunityIcons name="code-tags" size={22} />,
  },
];

