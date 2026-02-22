"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFieldDefinition } from "@/lib/field-catalog";

type FieldValueGetter = (fieldKey: string) => string;
type FieldValueSetter = (fieldKey: string, content: string) => void;

type StepFormContextValue = {
  workspaceId: string;
  currentStepId: number;
  selectedFieldKey: string | null;
  selectedFieldLabel: string | null;
  setSelectedFieldKey: (fieldKey: string | null) => void;
  setFormAccessors: (getValue: FieldValueGetter, setValue: FieldValueSetter) => void;
  insertIntoSelectedField: (text: string) => boolean;
};

const StepFormContext = createContext<StepFormContextValue | null>(null);

type StepFormProviderProps = {
  workspaceId: string;
  currentStepId: number;
  children: React.ReactNode;
};

export function StepFormProvider({
  workspaceId,
  currentStepId,
  children,
}: StepFormProviderProps) {
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const valueGetterRef = useRef<FieldValueGetter | null>(null);
  const valueSetterRef = useRef<FieldValueSetter | null>(null);

  useEffect(() => {
    setSelectedFieldKey(null);
  }, [workspaceId, currentStepId]);

  const setFormAccessors = useCallback(
    (getValue: FieldValueGetter, setValue: FieldValueSetter) => {
      valueGetterRef.current = getValue;
      valueSetterRef.current = setValue;
    },
    []
  );

  const insertIntoSelectedField = useCallback(
    (text: string) => {
      if (!selectedFieldKey || !valueGetterRef.current || !valueSetterRef.current) {
        return false;
      }

      const addition = text.trim();
      if (!addition) {
        return false;
      }

      const current = valueGetterRef.current(selectedFieldKey).trim();
      const nextValue = current ? `${current}\n\n${addition}` : addition;
      valueSetterRef.current(selectedFieldKey, nextValue);
      return true;
    },
    [selectedFieldKey]
  );

  const selectedFieldLabel = useMemo(() => {
    if (!selectedFieldKey) {
      return null;
    }

    return getFieldDefinition(selectedFieldKey)?.fieldLabel ?? selectedFieldKey;
  }, [selectedFieldKey]);

  const value = useMemo<StepFormContextValue>(
    () => ({
      workspaceId,
      currentStepId,
      selectedFieldKey,
      selectedFieldLabel,
      setSelectedFieldKey,
      setFormAccessors,
      insertIntoSelectedField,
    }),
    [
      workspaceId,
      currentStepId,
      selectedFieldKey,
      selectedFieldLabel,
      setFormAccessors,
      insertIntoSelectedField,
    ]
  );

  return <StepFormContext.Provider value={value}>{children}</StepFormContext.Provider>;
}

export function useStepFormContext() {
  const context = useContext(StepFormContext);
  if (!context) {
    throw new Error("useStepFormContext must be used within StepFormProvider.");
  }
  return context;
}

