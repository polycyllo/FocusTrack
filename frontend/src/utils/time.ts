export const DAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const DAY_LABEL: Record<string, string> = {
  L: "Lun",
  M: "Mar",
  X: "Mié",
  J: "Jue",
  V: "Vie",
  S: "Sáb",
  D: "Dom",
};

export function toHHmm(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function repeatToText(a: {
  repeatType: string;
  repeatDays?: string[] | null;
}) {
  if (a.repeatType === "once") return "Única vez";
  if (a.repeatType === "daily") return "Diario";
  const days = (a.repeatDays ?? []).map((d) => DAY_LABEL[d]).join("-");
  return `Lun-Dom`.length && days ? days : "Personalizada";
}

export function compareTimeAsc(a: string, b: string) {
  // '08:00' → 800
  const A = parseInt(a.replace(":", ""), 10);
  const B = parseInt(b.replace(":", ""), 10);
  return A - B;
}
