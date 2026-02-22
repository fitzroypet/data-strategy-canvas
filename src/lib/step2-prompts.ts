export type Step2Field = {
  key: "goal" | "data" | "kpi" | "decision";
  label: string;
  helper: string;
  placeholder: string;
  quickStart: string;
};

export type Step2BusinessArea = {
  key: string;
  label: string;
  example: Record<Step2Field["key"], string>;
};

export const step2Fields: Step2Field[] = [
  {
    key: "goal",
    label: "What are you trying to understand?",
    helper: "Describe the business question, not the dashboard you want.",
    placeholder: "Example: Are we improving student retention in each program?",
    quickStart: "We need to understand whether this area is performing as expected.",
  },
  {
    key: "data",
    label: "Important data",
    helper: "List the few data points that matter most for this question.",
    placeholder:
      "Example: Enrollment by grade, attendance, completion, feedback scores.",
    quickStart: "Current records, trend data, and qualitative feedback from this area.",
  },
  {
    key: "kpi",
    label: "Primary KPI",
    helper: "Pick one metric that signals health and can be tracked regularly.",
    placeholder: "Example: Monthly retention rate by segment.",
    quickStart: "Primary KPI: define one measurable indicator reviewed monthly.",
  },
  {
    key: "decision",
    label: "Decision this informs",
    helper: "State the decision the KPI should support.",
    placeholder:
      "Example: Should we redesign onboarding support for students at risk?",
    quickStart: "This KPI should guide an explicit decision about prioritization or investment.",
  },
];

export const step2BusinessAreas: Step2BusinessArea[] = [
  {
    key: "customer_segments",
    label: "Customer Segments",
    example: {
      goal: "Which student groups are most at risk of dropping off after first term?",
      data: "Student profile, entry pathway, attendance trend, support interactions.",
      kpi: "First-term retention rate by student segment.",
      decision: "Where should mentoring and student support resources be focused?",
    },
  },
  {
    key: "value_proposition",
    label: "Value Proposition",
    example: {
      goal: "Are students receiving the transformation outcomes we promise?",
      data: "Learning progress, assessment outcomes, learner satisfaction comments.",
      kpi: "Outcome achievement rate for the core promised capability.",
      decision: "Which parts of delivery should be strengthened this semester?",
    },
  },
  {
    key: "channels",
    label: "Channels",
    example: {
      goal: "Which channels attract and convert the right prospective students?",
      data: "Traffic source, inquiry volume, conversion to enrolled students.",
      kpi: "Qualified inquiry-to-enrollment conversion rate by channel.",
      decision: "Which channels should receive more budget and attention next quarter?",
    },
  },
  {
    key: "customer_relationships",
    label: "Customer Relationships",
    example: {
      goal: "How strong is ongoing engagement once students are enrolled?",
      data: "Advisor response times, student touchpoints, support satisfaction.",
      kpi: "Student engagement score across key support milestones.",
      decision: "Where do we redesign communication and support workflows?",
    },
  },
  {
    key: "revenue_streams",
    label: "Revenue Streams",
    example: {
      goal: "Which programs generate sustainable revenue without harming quality?",
      data: "Program enrollments, payment patterns, refund and dropout rates.",
      kpi: "Net revenue per active student by program.",
      decision: "Which program offers should be expanded, fixed, or phased out?",
    },
  },
  {
    key: "key_resources",
    label: "Key Resources",
    example: {
      goal: "Which resources are constraining delivery quality most often?",
      data: "Staff availability, tool usage, classroom utilization, content readiness.",
      kpi: "Resource utilization rate for critical delivery assets.",
      decision: "What resource investments should be prioritized first?",
    },
  },
  {
    key: "key_activities",
    label: "Key Activities",
    example: {
      goal: "Which activities drive successful learner outcomes most consistently?",
      data: "Activity completion, cycle time, error rates, student outcomes.",
      kpi: "On-time completion rate for high-impact activities.",
      decision: "Which operational activities need redesign or automation?",
    },
  },
  {
    key: "key_partnerships",
    label: "Key Partnerships",
    example: {
      goal: "How reliable are partner contributions to student outcomes?",
      data: "Partner deliverable timeliness, quality feedback, escalation frequency.",
      kpi: "Partner SLA and quality adherence rate.",
      decision: "Which partner relationships need renegotiation or replacement?",
    },
  },
  {
    key: "cost_structure",
    label: "Cost Structure",
    example: {
      goal: "Which cost lines are rising without clear student value impact?",
      data: "Program costs, delivery costs, support costs, utilization trends.",
      kpi: "Cost-to-outcome ratio per program area.",
      decision: "Where should cost optimization happen without reducing learner value?",
    },
  },
];

export const step2NotSurePrompt =
  "I am not sure yet; I need more evidence from stakeholders before finalizing this area.";

export function createStep2FieldKey(areaKey: string, fieldKey: Step2Field["key"]) {
  return `kpi_${areaKey}_${fieldKey}`;
}

export function createStep2IntentKey(areaKey: string) {
  return `kpi_${areaKey}__intent`;
}
