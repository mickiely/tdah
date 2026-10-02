export const SMALL_WINS = [
  { id: "teeth", title: "Brushed my teeth", icon: "🪥" },
  { id: "bed", title: "Made the bed", icon: "🛏️" },
  { id: "toilet", title: "Went to the toilet", icon: "🚽" },
  { id: "water", title: "Drank water", icon: "💧" },
  { id: "curtains", title: "Opened the curtains", icon: "☀️" },
  { id: "clothes", title: "Got dressed", icon: "👕" },
] as const;

export function smallWinItems(wins: {
  custom: Array<{ id: string; title: string }>;
  labels?: Record<string, string>;
}) {
  return [...SMALL_WINS, ...wins.custom.map((win) => ({ ...win, icon: "✨" }))]
    .map((win) => ({ ...win, title: wins.labels?.[win.id] || win.title }));
}
