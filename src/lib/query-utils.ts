/**
 * Helpers to build Prisma date filters from query params, shared across routes.
 *
 * Two flavours exist on purpose:
 *  - `occurredAtRange`  → for `DateTime` columns (`occurredAt`), using UTC day bounds.
 *  - `dateStringRange`  → for `String` "YYYY-MM-DD" columns (`date`).
 *
 * Both accept a single `date` (exact day) or a `from`/`to` pair (inclusive range),
 * and return `undefined` when no filter applies.
 */

export function occurredAtRange(
  date: string | null,
  from: string | null,
  to: string | null
): { gte: Date; lte: Date } | undefined {
  if (date) {
    return {
      gte: new Date(`${date}T00:00:00.000Z`),
      lte: new Date(`${date}T23:59:59.999Z`),
    };
  }
  if (from && to) {
    return {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    };
  }
  return undefined;
}

export function dateStringRange(
  date: string | null,
  from: string | null,
  to: string | null
): string | { gte: string; lte: string } | undefined {
  if (date) return date;
  if (from && to) return { gte: from, lte: to };
  return undefined;
}
