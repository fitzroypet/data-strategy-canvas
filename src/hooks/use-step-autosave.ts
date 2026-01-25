"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upsertStepEntries } from "@/app/actions/step-entries";

type SaveState = "idle" | "saving" | "saved";

type UseStepAutosaveArgs = {
  workspaceId: string;
  stepId: number;
  initialValues: Record<string, string>;
};

export function useStepAutosave({
  workspaceId,
  stepId,
  initialValues,
}: UseStepAutosaveArgs) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const entriesForSave = useMemo(
    () =>
      Object.entries(values).map(([fieldKey, content]) => ({
        fieldKey,
        content,
      })),
    [values]
  );

  const saveNow = async (payload = entriesForSave) => {
    setSaveState("saving");
    await upsertStepEntries(workspaceId, stepId, payload);
    setSaveState("saved");
  };

  const scheduleSave = (payload = entriesForSave) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    setSaveState("saving");
    saveTimeout.current = setTimeout(() => {
      void saveNow(payload);
    }, 600);
  };

  const setFieldValue = (fieldKey: string, content: string) => {
    setValues((prev) => {
      const next = { ...prev, [fieldKey]: content };
      scheduleSave(
        Object.entries(next).map(([key, value]) => ({
          fieldKey: key,
          content: value,
        }))
      );
      return next;
    });
  };

  const handleBlur = () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    void saveNow();
  };

  useEffect(() => {
    if (saveState !== "saved") {
      return;
    }
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }
    resetTimeout.current = setTimeout(() => {
      setSaveState("idle");
    }, 2000);
    return () => {
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
    };
  }, [saveState]);

  return {
    values,
    saveState,
    setFieldValue,
    handleBlur,
  };
}
