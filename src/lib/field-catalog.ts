export type StepFieldDefinition = {
  stepId: number;
  fieldKey: string;
  fieldLabel: string;
  stepTitle: string;
};

const stepFieldDefinitions: StepFieldDefinition[] = [
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "customer_segments", fieldLabel: "Customer Segments" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "value_proposition", fieldLabel: "Value Proposition" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "channels", fieldLabel: "Channels" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "customer_relationships", fieldLabel: "Customer Relationships" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "revenue_streams", fieldLabel: "Revenue Streams" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "key_resources", fieldLabel: "Key Resources" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "key_activities", fieldLabel: "Key Activities" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "key_partnerships", fieldLabel: "Key Partnerships" },
  { stepId: 1, stepTitle: "Business Model Mapping", fieldKey: "cost_structure", fieldLabel: "Cost Structure" },

  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_segments_goal", fieldLabel: "Customer Segments - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_segments_data", fieldLabel: "Customer Segments - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_segments_kpi", fieldLabel: "Customer Segments - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_segments_decision", fieldLabel: "Customer Segments - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_value_proposition_goal", fieldLabel: "Value Proposition - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_value_proposition_data", fieldLabel: "Value Proposition - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_value_proposition_kpi", fieldLabel: "Value Proposition - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_value_proposition_decision", fieldLabel: "Value Proposition - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_channels_goal", fieldLabel: "Channels - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_channels_data", fieldLabel: "Channels - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_channels_kpi", fieldLabel: "Channels - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_channels_decision", fieldLabel: "Channels - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_relationships_goal", fieldLabel: "Customer Relationships - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_relationships_data", fieldLabel: "Customer Relationships - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_relationships_kpi", fieldLabel: "Customer Relationships - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_customer_relationships_decision", fieldLabel: "Customer Relationships - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_revenue_streams_goal", fieldLabel: "Revenue Streams - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_revenue_streams_data", fieldLabel: "Revenue Streams - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_revenue_streams_kpi", fieldLabel: "Revenue Streams - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_revenue_streams_decision", fieldLabel: "Revenue Streams - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_resources_goal", fieldLabel: "Key Resources - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_resources_data", fieldLabel: "Key Resources - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_resources_kpi", fieldLabel: "Key Resources - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_resources_decision", fieldLabel: "Key Resources - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_activities_goal", fieldLabel: "Key Activities - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_activities_data", fieldLabel: "Key Activities - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_activities_kpi", fieldLabel: "Key Activities - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_activities_decision", fieldLabel: "Key Activities - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_partnerships_goal", fieldLabel: "Key Partnerships - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_partnerships_data", fieldLabel: "Key Partnerships - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_partnerships_kpi", fieldLabel: "Key Partnerships - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_key_partnerships_decision", fieldLabel: "Key Partnerships - Decision" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_cost_structure_goal", fieldLabel: "Cost Structure - Goal" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_cost_structure_data", fieldLabel: "Cost Structure - Important Data" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_cost_structure_kpi", fieldLabel: "Cost Structure - Primary KPI" },
  { stepId: 2, stepTitle: "Data & KPI Mapping", fieldKey: "kpi_cost_structure_decision", fieldLabel: "Cost Structure - Decision" },

  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "people_culture_level", fieldLabel: "People & Culture - Level" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "people_culture_evidence", fieldLabel: "People & Culture - Evidence" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "people_culture_constraints", fieldLabel: "People & Culture - Constraints" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "processes_level", fieldLabel: "Processes - Level" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "processes_evidence", fieldLabel: "Processes - Evidence" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "processes_constraints", fieldLabel: "Processes - Constraints" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "technology_level", fieldLabel: "Technology - Level" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "technology_evidence", fieldLabel: "Technology - Evidence" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "technology_constraints", fieldLabel: "Technology - Constraints" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "governance_level", fieldLabel: "Governance - Level" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "governance_evidence", fieldLabel: "Governance - Evidence" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "governance_constraints", fieldLabel: "Governance - Constraints" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "strategy_impact_level", fieldLabel: "Strategy & Impact - Level" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "strategy_impact_evidence", fieldLabel: "Strategy & Impact - Evidence" },
  { stepId: 3, stepTitle: "Data Maturity Assessment", fieldKey: "strategy_impact_constraints", fieldLabel: "Strategy & Impact - Constraints" },

  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_capture_today", fieldLabel: "Capture - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_capture_people", fieldLabel: "Capture - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_capture_tools", fieldLabel: "Capture - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_capture_pains", fieldLabel: "Capture - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_capture_impact", fieldLabel: "Capture - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_store_today", fieldLabel: "Store - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_store_people", fieldLabel: "Store - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_store_tools", fieldLabel: "Store - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_store_pains", fieldLabel: "Store - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_store_impact", fieldLabel: "Store - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_prepare_today", fieldLabel: "Prepare - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_prepare_people", fieldLabel: "Prepare - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_prepare_tools", fieldLabel: "Prepare - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_prepare_pains", fieldLabel: "Prepare - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_prepare_impact", fieldLabel: "Prepare - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_analyse_today", fieldLabel: "Analyse - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_analyse_people", fieldLabel: "Analyse - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_analyse_tools", fieldLabel: "Analyse - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_analyse_pains", fieldLabel: "Analyse - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_analyse_impact", fieldLabel: "Analyse - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_visualise_today", fieldLabel: "Visualise - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_visualise_people", fieldLabel: "Visualise - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_visualise_tools", fieldLabel: "Visualise - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_visualise_pains", fieldLabel: "Visualise - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_visualise_impact", fieldLabel: "Visualise - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_act_today", fieldLabel: "Act - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_act_people", fieldLabel: "Act - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_act_tools", fieldLabel: "Act - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_act_pains", fieldLabel: "Act - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_act_impact", fieldLabel: "Act - Impact on Decisions" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_learn_today", fieldLabel: "Learn - What Happens Today?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_learn_people", fieldLabel: "Learn - Who Is Involved?" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_learn_tools", fieldLabel: "Learn - Tools Used" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_learn_pains", fieldLabel: "Learn - Pain Points / Gaps" },
  { stepId: 4, stepTitle: "Data Lifecycle Mapping", fieldKey: "lifecycle_learn_impact", fieldLabel: "Learn - Impact on Decisions" },

  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "customer_profile", fieldLabel: "Customer Profile" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "jobs_to_be_done", fieldLabel: "Jobs To Be Done" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "pains", fieldLabel: "Pains" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "gains", fieldLabel: "Gains" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "proposed_initiative", fieldLabel: "Proposed Initiative" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "pain_relievers", fieldLabel: "Pain Relievers" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "gain_creators", fieldLabel: "Gain Creators" },
  { stepId: 5, stepTitle: "Value Proposition Mapping", fieldKey: "delivery_mechanism", fieldLabel: "Delivery Mechanism" },

  { stepId: 6, stepTitle: "Data Vision", fieldKey: "decision_change", fieldLabel: "Decision Change" },
  { stepId: 6, stepTitle: "Data Vision", fieldKey: "capability_shift", fieldLabel: "Capability Shift" },
  { stepId: 6, stepTitle: "Data Vision", fieldKey: "business_value", fieldLabel: "Business Value" },
  { stepId: 6, stepTitle: "Data Vision", fieldKey: "scope_boundaries", fieldLabel: "Scope & Boundaries" },
  { stepId: 6, stepTitle: "Data Vision", fieldKey: "vision_statement", fieldLabel: "Vision Statement" },
];

export const VALID_FIELD_KEYS = new Set(stepFieldDefinitions.map((entry) => entry.fieldKey));

export const STEP_FIELD_DEFINITIONS = stepFieldDefinitions;

export function getFieldDefinition(fieldKey: string) {
  return stepFieldDefinitions.find((entry) => entry.fieldKey === fieldKey);
}

export function groupFieldDefinitionsByStep() {
  const grouped = new Map<number, StepFieldDefinition[]>();

  for (const definition of stepFieldDefinitions) {
    const list = grouped.get(definition.stepId) ?? [];
    list.push(definition);
    grouped.set(definition.stepId, list);
  }

  return grouped;
}

