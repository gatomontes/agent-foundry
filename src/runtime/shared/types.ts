export type ConsequenceTier = "trivial" | "routine" | "important" | "critical";

export type RuntimeTimestamp = string;

export interface RuntimeReference {
  id: string;
  kind: string;
}

export interface ProductionProfile {
  mode: "prototype" | "production";
  evidenceLevel: "governance-shaped" | "runtime-attested";
  retentionPolicy: "replace-root" | "append-only-runs";
  manifestStrategy: "hash-only" | "hmac-sha256";
}

export interface ManifestSignature {
  algorithm: "hmac-sha256";
  keyId: string;
  signature: string;
  signedAt: RuntimeTimestamp;
}

export interface ExecutionEvidence {
  runtimeSessionId: string;
  initiatedAt: RuntimeTimestamp;
  initiatedBy: string;
  missionState: string;
  topologyAssigned: boolean;
  requiredProfessions: string[];
  optionalProfessions: string[];
  activeDelegationCount: number;
  evidenceRefs: string[];
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
