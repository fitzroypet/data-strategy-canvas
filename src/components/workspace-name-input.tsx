"use client";

import { useEffect, useState, useTransition } from "react";
import { updateWorkspaceName } from "@/app/actions/workspaces";

type WorkspaceNameInputProps = {
  workspaceId: string;
  initialName: string;
};

export function WorkspaceNameInput({
  workspaceId,
  initialName,
}: WorkspaceNameInputProps) {
  const [name, setName] = useState(initialName);
  const [lastSaved, setLastSaved] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(initialName);
    setLastSaved(initialName);
  }, [initialName, workspaceId]);

  const handleBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === lastSaved) {
      setName(lastSaved);
      return;
    }

    startTransition(async () => {
      await updateWorkspaceName(workspaceId, trimmed);
      setLastSaved(trimmed);
      setName(trimmed);
    });
  };

  return (
    <input
      className="h-9 w-56 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400 disabled:opacity-70"
      value={name}
      onChange={(event) => setName(event.target.value)}
      onBlur={handleBlur}
      disabled={isPending}
      aria-label="Workspace name"
    />
  );
}
