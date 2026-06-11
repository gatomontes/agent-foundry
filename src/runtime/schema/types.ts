export type JsonSchema =
  | {
      type?: "object" | "array" | "string" | "integer" | "boolean";
      const?: string;
      enum?: string[];
      required?: string[];
      additionalProperties?: boolean;
      minLength?: number;
      minimum?: number;
      minItems?: number;
      pattern?: string;
      properties?: Record<string, JsonSchema>;
      items?: JsonSchema;
    };

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface CodexSkillBundleValidationResult {
  bundlePath: string;
  valid: boolean;
  issues: ValidationIssue[];
}
