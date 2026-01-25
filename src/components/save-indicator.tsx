type SaveIndicatorProps = {
  state: "idle" | "saving" | "saved";
};

export function SaveIndicator({ state }: SaveIndicatorProps) {
  if (state === "idle") {
    return <span className="text-xs text-transparent">Saved</span>;
  }

  return (
    <span className="text-xs text-zinc-500">
      {state === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}
