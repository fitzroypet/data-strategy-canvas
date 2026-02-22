export type WorkspaceDocumentStatus = "uploaded" | "processed" | "expired" | "failed";
export type ImportRunStatus = "parsed" | "previewed" | "applied" | "failed";

export type ImportPreviewItem = {
  fieldKey: string;
  fieldLabel: string;
  stepId: number;
  stepTitle: string;
  proposedContent: string;
  willApply: boolean;
};

export type ImportPreviewGroup = {
  stepId: number;
  stepTitle: string;
  items: ImportPreviewItem[];
};

export type ImportPreviewResult = {
  runId: string;
  warnings: string[];
  groups: ImportPreviewGroup[];
  totals: {
    mapped: number;
    willApply: number;
    willSkip: number;
  };
};

export type ApplyImportResult = {
  appliedFieldsCount: number;
  skippedFieldsCount: number;
};

