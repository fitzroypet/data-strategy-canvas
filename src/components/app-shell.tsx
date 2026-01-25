import Link from "next/link";
import { steps } from "@/lib/steps";
import { SidebarStepItem } from "@/components/sidebar-step-item";
import { WorkspaceNameInput } from "@/components/workspace-name-input";

type AppShellProps = {
  children: React.ReactNode;
  workspaceId: string;
  workspaceName: string;
  currentStep?: number;
};

export function AppShell({
  children,
  workspaceId,
  workspaceName,
  currentStep = 1,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3f0_0%,_#f7f7f5_45%,_#ffffff_100%)] text-zinc-900">
      <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
              P
            </div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Petgrave.io
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WorkspaceNameInput
              workspaceId={workspaceId}
              initialName={workspaceName}
            />
            <button className="h-9 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:border-zinc-300">
              Export
            </button>
            <button className="h-9 w-9 rounded-full border border-zinc-200 text-sm text-zinc-500 hover:border-zinc-300">
              ?
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Steps
            </div>
            <div className="flex flex-col gap-2">
              {steps.map((step) => (
                <Link key={step.id} href={step.path} className="block">
                  <SidebarStepItem
                    stepNumber={step.id}
                    title={step.title}
                    status={step.id === 1 ? "in_progress" : "draft"}
                    isActive={step.id === currentStep}
                  />
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1">{children}</main>

        <aside className="hidden w-72 shrink-0 lg:flex">
          <div className="h-fit w-full rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Refine With AI
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Ask for gentle prompts when you feel stuck or want clarity.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                "Refine this for clarity",
                "Challenge my assumptions",
                "Highlight vagueness",
                "Suggest missing considerations",
              ].map((label) => (
                <button
                  key={label}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
