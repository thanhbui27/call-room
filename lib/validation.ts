import { MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, ROOM_ID_PATTERN } from "@/lib/constants";

export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > MAX_NAME_LENGTH) return null;
  return normalized;
}

export function isValidRoomId(value: unknown): value is string {
  return typeof value === "string" && ROOM_ID_PATTERN.test(value);
}

export function normalizeMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_MESSAGE_LENGTH) return null;
  return normalized;
}
