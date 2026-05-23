export type ConsequenceTier = "trivial" | "routine" | "important" | "critical";

export type RuntimeTimestamp = string;

export interface RuntimeReference {
  id: string;
  kind: string;
}

export interface AuditRecord {
  at: RuntimeTimestamp;
  actorId: string;
  summary: string;
}

export function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

export function toTimestamp(date: Date = new Date()): RuntimeTimestamp {
  return date.toISOString();
}
