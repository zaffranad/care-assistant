import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatFullDate(date: Date): string {
  return format(date, "EEEE d MMMM yyyy", { locale: fr });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm", { locale: fr });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM", { locale: fr });
}

export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatTimeForInput(date: Date): string {
  return format(date, "HH:mm");
}

export function getTodayDateString(): string {
  return formatDateForInput(new Date());
}

/**
 * Formats a minute offset relative to a scheduled time.
 * 0 → "à l'heure", positive → "+1h30", negative → "−45min".
 */
export function formatDelta(delta: number): string {
  if (delta === 0) return "à l'heure";
  const abs = Math.abs(delta);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const prefix = delta < 0 ? "−" : "+";
  if (h > 0 && m > 0) return `${prefix}${h}h${m.toString().padStart(2, "0")}`;
  if (h > 0) return `${prefix}${h}h`;
  return `${prefix}${m}min`;
}

/**
 * Returns a color based on intensity (1-10)
 * Green (low) -> Yellow (medium) -> Red (high)
 */
export function getIntensityColor(intensity: number): string {
  if (intensity <= 3) return "rgb(34, 197, 94)";    // green
  if (intensity <= 5) return "rgb(234, 179, 8)";     // yellow
  if (intensity <= 7) return "rgb(249, 115, 22)";    // orange
  return "rgb(239, 68, 68)";                          // red
}

export function getIntensityBgClass(intensity: number): string {
  if (intensity <= 3) return "bg-green-500";
  if (intensity <= 5) return "bg-yellow-500";
  if (intensity <= 7) return "bg-orange-500";
  return "bg-red-500";
}

export function getIntensityTextClass(intensity: number): string {
  if (intensity <= 3) return "text-green-600 dark:text-green-400";
  if (intensity <= 5) return "text-yellow-600 dark:text-yellow-400";
  if (intensity <= 7) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}
