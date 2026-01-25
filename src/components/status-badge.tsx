import type { StepStatus } from "@/lib/steps";

const statusStyles: Record<StepStatus, string> = {
  draft: "text-zinc-500 bg-zinc-100",
  in_progress: "text-zinc-700 bg-zinc-200",
  clear: "text-emerald-700 bg-emerald-50",
};

const statusLabel: Record<StepStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  clear: "Clear",
};

export function StatusBadge({ status }: { status: StepStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
