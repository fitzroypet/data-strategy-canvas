"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upsertStepEntries } from "@/app/actions/step-entries";

type SaveState = "idle" | "saving" | "saved" | "error";

type UseStepAutosaveArgs = {
  workspaceId: string;
  stepId: number;
  initialValues: Record<string, string>;
};

type StepEntryPayload = {
  fieldKey: string;
  content: string;
};

export function useStepAutosave({
  workspaceId,
  stepId,
  initialValues,
}: UseStepAutosaveArgs) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadRef = useRef<StepEntryPayload[]>([]);

  useEffect(() => {
    setValues(initialValues);
    setErrorMessage(null);
    setSaveState("idle");
  }, [initialValues, workspaceId, stepId]);

  const entriesForSave = useMemo(
    () =>
      Object.entries(values).map(([fieldKey, content]) => ({
        fieldKey,
        content,
      })),
    [values]
  );

  const saveNow = async (payload = entriesForSave) => {
    lastPayloadRef.current = payload;
    setSaveState("saving");
    setErrorMessage(null);

    try {
      await upsertStepEntries(workspaceId, stepId, payload);
      setSaveState("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save changes.";
      setSaveState("error");
      setErrorMessage(message);
    }
  };

  const scheduleSave = (payload = entriesForSave) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    setSaveState("saving");
    setErrorMessage(null);

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

  const retrySave = () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    void saveNow(lastPayloadRef.current.length > 0 ? lastPayloadRef.current : entriesForSave);
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

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  return {
    values,
    saveState,
    errorMessage,
    setFieldValue,
    handleBlur,
    retrySave,
  };
}
