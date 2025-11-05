export function formatPomodoroTime(minutes: number): string {
  if (minutes < 60) return `${minutes} m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours} H${remainingMinutes > 0 ? ` ${remainingMinutes} m` : ""}`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days} D${remainingHours > 0 ? ` ${remainingHours} H` : ""}${
    remainingMinutes > 0 ? ` ${remainingMinutes} m` : ""
  }`;
}
