import type { StepStatus } from "@/lib/steps";
import { StatusBadge } from "@/components/status-badge";

type SidebarStepItemProps = {
  stepNumber: number;
  title: string;
  status: StepStatus;
  isActive?: boolean;
};

export function SidebarStepItem({
  stepNumber,
  title,
  status,
  isActive,
}: SidebarStepItemProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-3 py-2 ${
        isActive ? "bg-white shadow-sm" : "hover:bg-white/70"
      }`}
    >
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-xs font-semibold text-zinc-600">
        {stepNumber}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-zinc-800">{title}</span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
