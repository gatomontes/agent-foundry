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
  runPath: string;
  directoriesCreated: string[];
  filesCreated: string[];
  runPackageManifestPath: string;
  scribeReportPath: string;
  critiqueReportPath: string | null;
  auditReportPath: string | null;
  failurePathReportPath: string;
  hashManifestPath: string;
  signaturePath: string | null;
  attestationPath: string | null;
  executionEvidencePath: string | null;
  workerManifestPath: string | null;
  workerSpecPaths: string[];
  codexSkillBundlePaths: string[];
}
