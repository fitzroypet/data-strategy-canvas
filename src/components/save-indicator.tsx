type SaveIndicatorProps = {
  state: "idle" | "saving" | "saved" | "error";
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function SaveIndicator({
  state,
  errorMessage,
  onRetry,
}: SaveIndicatorProps) {
  if (state === "idle") {
    return <span className="text-xs text-transparent">Saved</span>;
  }

  if (state === "error") {
    return (
      <span className="flex items-center gap-2 text-xs text-rose-600">
        <span>{errorMessage?.trim() || "Could not save. Check your connection."}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 px-2 py-0.5 font-medium text-rose-700 hover:border-rose-300"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="text-xs text-zinc-500">
      {state === "saving" ? "Saving..." : "Saved"}
    </span>
  );
}
