export type StepStatus = "draft" | "in_progress" | "clear";

export const steps = [
  {
    id: 1,
    key: "business_model",
    title: "Business Model Mapping",
    description: "Understand how your organisation creates, delivers, and captures value.",
    path: "/canvas",
  },
  {
    id: 2,
    key: "kpi_mapping",
    title: "Data & KPI Mapping",
    description: "Define what success means for each part of your business.",
    path: "/step/2",
  },
  {
    id: 3,
    key: "maturity",
    title: "Data Maturity Assessment",
    description: "Understand what your organisation is realistically capable of today.",
    path: "/step/3",
  },
  {
    id: 4,
    key: "lifecycle",
    title: "Data Lifecycle Mapping",
    description: "Identify where data breaks down before it becomes a decision.",
    path: "/step/4",
  },
  {
    id: 5,
    key: "value_map",
    title: "Value Proposition Mapping",
    description: "Decide what is actually worth building or improving.",
    path: "/step/5",
  },
  {
    id: 6,
    key: "vision",
    title: "Data Vision",
    description: "Articulate where you are heading and how decisions will change.",
    path: "/step/6",
  },
];
