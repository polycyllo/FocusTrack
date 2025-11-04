export function formatPomodoroTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 24) {
    return `${hours} h${remaining > 0 ? ` ${remaining} min` : ""}`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} día${days > 1 ? "s" : ""}`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} semana${weeks > 1 ? "s" : ""}`;
  }
  const months = Math.floor(weeks / 4);
  if (months < 12) {
    return `${months} mes${months > 1 ? "es" : ""}`;
  }
  const years = Math.floor(months / 12);
  return `${years} año${years > 1 ? "s" : ""}`;
}
