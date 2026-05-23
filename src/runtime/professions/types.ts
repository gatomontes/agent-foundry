import type { AuthorityPolicy } from "../authority/types.js";

export type VerificationLevel = "lightweight" | "standard" | "independent";

export interface ProfessionManifest {
  id: string;
  name: string;
  purpose: string;
  responsibilities: string[];
  expectedArtifacts: string[];
  verificationLevel: VerificationLevel;
  preferredRuntimes: string[];
  escalationConditions: string[];
  authorityPolicy: AuthorityPolicy;
  personaExpressions?: string[];
}

export interface ProfessionSelection {
  professionId: string;
  reason: string;
  required: boolean;
}
