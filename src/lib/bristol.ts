export type BristolCategory = "Constipation" | "Normal" | "Mou" | "Diarrhée";

export interface BristolInfo {
  type: number;
  description: string;
  category: BristolCategory;
  emoji: string;
}

export const BRISTOL_SCALE: readonly BristolInfo[] = [
  { type: 1, description: "Billes dures séparées", category: "Constipation", emoji: "⚫" },
  { type: 2, description: "En saucisse, grumeleuse", category: "Constipation", emoji: "🟤" },
  { type: 3, description: "En saucisse, fissurée", category: "Normal", emoji: "🟫" },
  { type: 4, description: "Lisse et souple", category: "Normal", emoji: "🟢" },
  { type: 5, description: "Morceaux mous", category: "Mou", emoji: "🟡" },
  { type: 6, description: "Floconneuse, pâteuse", category: "Diarrhée", emoji: "🟠" },
  { type: 7, description: "Liquide, sans morceaux", category: "Diarrhée", emoji: "🔴" },
] as const;

export const BRISTOL_LABELS: Record<number, string> = Object.fromEntries(
  BRISTOL_SCALE.map((b) => [b.type, b.description])
);

export function getBristolInfo(type: number): BristolInfo {
  return BRISTOL_SCALE[type - 1] ?? BRISTOL_SCALE[3];
}

export function getBristolCategory(type: number): BristolCategory {
  return getBristolInfo(type).category;
}

export function getBristolColor(type: number): string {
  if (type <= 2) return "text-amber-700 dark:text-amber-400";
  if (type <= 4) return "text-green-600 dark:text-green-400";
  if (type <= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-orange-600 dark:text-orange-400";
}

export function getBristolBgClass(type: number): string {
  if (type <= 2) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
  if (type <= 4) return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
  if (type <= 5) return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900";
  return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
}

export function getCategoryBadgeClasses(type: number): string {
  if (type <= 2) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  if (type <= 4) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (type <= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
}

export function getBristolBarColor(type: number): string {
  if (type <= 2) return "oklch(0.60 0.15 70)";
  if (type <= 4) return "oklch(0.65 0.18 150)";
  if (type === 5) return "oklch(0.70 0.15 80)";
  return "oklch(0.60 0.20 25)";
}
