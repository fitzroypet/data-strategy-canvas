export type StepStatus = "draft" | "in_progress" | "clear";

export const steps = [
  { id: 1, key: "business_model", title: "Business Model Mapping" },
  { id: 2, key: "kpi_mapping", title: "Data & KPI Mapping" },
  { id: 3, key: "maturity", title: "Data Maturity Assessment" },
  { id: 4, key: "lifecycle", title: "Data Lifecycle Mapping" },
  { id: 5, key: "value_map", title: "Value Proposition Mapping" },
  { id: 6, key: "vision", title: "Data Vision" },
];
