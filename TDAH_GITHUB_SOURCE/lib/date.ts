import type { SupabaseClient } from "@supabase/supabase-js";

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// Returns YYYY-MM-DD for "now" as observed in the given IANA timezone,
// so daily records roll over at local midnight rather than UTC midnight.
export function localDateString(timeZone: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

// Resolves "today" in the signed-in user's own timezone (profiles.timezone),
// so daily records roll over at their local midnight, not the server's.
export async function getUserLocalToday(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  return localDateString(profile?.timezone ?? "UTC");
}
