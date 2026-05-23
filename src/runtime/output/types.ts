export interface OutputStructureProposal {
  projectSlug: string;
  rootPath: string;
  directories: string[];
  canonicalFiles: string[];
  rationale: string[];
  decidedBy: "carmilla";
}

export interface OutputMaterializationResult {
  rootPath: string;
  directoriesCreated: string[];
  filesCreated: string[];
  scribeReportPath: string;
  critiqueReportPath: string | null;
  auditReportPath: string | null;
  failurePathReportPath: string;
  hashManifestPath: string;
}
