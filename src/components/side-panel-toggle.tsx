"use client";

type PanelMode = "steps" | "ai";

type SidePanelToggleProps = {
  mode: PanelMode;
  onChange: (mode: PanelMode) => void;
};

export function SidePanelToggle({ mode, onChange }: SidePanelToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange("steps")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          mode === "steps"
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:text-zinc-800"
        }`}
      >
        Steps
      </button>
      <button
        type="button"
        onClick={() => onChange("ai")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          mode === "ai"
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:text-zinc-800"
        }`}
      >
        AI
      </button>
    </div>
  );
}

