"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { steps } from "@/lib/steps";
import { SidebarStepItem } from "@/components/sidebar-step-item";
import { WorkspaceNameInput } from "@/components/workspace-name-input";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { ImportStrategyModal } from "@/components/import-strategy-modal";
import { DashboardLink } from "@/components/dashboard-link";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { SidePanelToggle } from "@/components/side-panel-toggle";
import { StepFormProvider } from "@/components/step-form-context";
import type { StepStatusMap } from "@/lib/step-status";
import type { WorkspaceSummary } from "@/lib/workspace-selection";

type AppShellProps = {
  children: React.ReactNode;
  workspaceId: string;
  workspaceName: string;
  workspaces: WorkspaceSummary[];
  stepStatuses: StepStatusMap;
  importEnabled?: boolean;
  aiChatEnabled?: boolean;
  currentStep?: number;
};

export function AppShell({
  children,
  workspaceId,
  workspaceName,
  workspaces,
  stepStatuses,
  importEnabled = false,
  aiChatEnabled = false,
  currentStep = 1,
}: AppShellProps) {
  const [panelMode, setPanelMode] = useState<"steps" | "ai">("steps");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const panelStorageKey = "step_side_panel_mode";

  useEffect(() => {
    if (!aiChatEnabled || typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(panelStorageKey);
    if (stored === "steps" || stored === "ai") {
      setPanelMode(stored);
    }
  }, [aiChatEnabled]);

  useEffect(() => {
    if (!aiChatEnabled || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(panelStorageKey, panelMode);
  }, [aiChatEnabled, panelMode]);

  const showStepsSidebar = !aiChatEnabled || panelMode === "steps";
  const showAiSidebar = aiChatEnabled && panelMode === "ai";

  const stepsPanel = useMemo(
    () => (
      <div className="h-fit w-full rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Steps
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={{ pathname: step.path, query: { workspace: workspaceId } }}
              className="block"
              onClick={() => setMobilePanelOpen(false)}
            >
              <SidebarStepItem
                stepNumber={step.id}
                title={step.title}
                status={stepStatuses[step.id] ?? "draft"}
                isActive={step.id === currentStep}
              />
            </Link>
          ))}
        </div>
      </div>
    ),
    [workspaceId, stepStatuses, currentStep]
  );

  return (
    <StepFormProvider workspaceId={workspaceId} currentStepId={currentStep}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3f0_0%,_#f7f7f5_45%,_#ffffff_100%)] text-zinc-900">
        <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-auto max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
                P
              </div>
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Petgrave.io
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <WorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={workspaceId}
              />
              <WorkspaceNameInput
                workspaceId={workspaceId}
                initialName={workspaceName}
              />
              <DashboardLink />
              {aiChatEnabled && (
                <SidePanelToggle mode={panelMode} onChange={setPanelMode} />
              )}
              {importEnabled && <ImportStrategyModal workspaceId={workspaceId} />}
              <button className="h-9 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:border-zinc-300">
                Export
              </button>
              <button className="h-9 w-9 rounded-full border border-zinc-200 text-sm text-zinc-500 hover:border-zinc-300">
                ?
              </button>
            </div>
          </div>
        </div>

        {aiChatEnabled && (
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-3 lg:hidden">
            <span className="text-xs text-zinc-500">
              Active panel: {panelMode === "steps" ? "Steps" : "AI"}
            </span>
            <button
              type="button"
              onClick={() => setMobilePanelOpen(true)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700"
            >
              Open Panel
            </button>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6">
          {showStepsSidebar && (
            <aside className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
              {stepsPanel}
            </aside>
          )}

          <main className="flex-1">{children}</main>

          {showAiSidebar && (
            <aside className="hidden w-80 shrink-0 lg:flex">
              <AiChatPanel workspaceId={workspaceId} currentStepId={currentStep} />
            </aside>
          )}
        </div>
        {aiChatEnabled && mobilePanelOpen && (
          <div className="fixed inset-0 z-50 bg-zinc-900/35 p-4 lg:hidden">
            <div className="mx-auto flex h-full max-w-6xl flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <SidePanelToggle mode={panelMode} onChange={setPanelMode} />
                <button
                  type="button"
                  onClick={() => setMobilePanelOpen(false)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {panelMode === "steps" ? (
                  stepsPanel
                ) : (
                  <AiChatPanel workspaceId={workspaceId} currentStepId={currentStep} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StepFormProvider>
  );
}
