"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startWorkspaceFromLanding } from "@/app/actions/landing";
import { UploadDropzone } from "@/components/landing/upload-dropzone";

type StartPanelProps = {
  isAuthenticated: boolean;
  resumeMode: boolean;
  initialPrompt?: string;
};

const STORAGE_KEY_PROMPT = "landing_prompt_draft";

export function StartPanel({
  isAuthenticated,
  resumeMode,
  initialPrompt = "",
}: StartPanelProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [files, setFiles] = useState<File[]>([]);
  const [workspaceName, setWorkspaceName] = useState("My Strategy");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (resumeMode) {
      const savedPrompt = window.sessionStorage.getItem(STORAGE_KEY_PROMPT);
      if (savedPrompt && !prompt.trim()) {
        setPrompt(savedPrompt);
      }
    }
  }, [resumeMode, prompt]);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !isPending, [prompt, isPending]);

  const handleStart = () => {
    setError(null);
    setMessage(null);

    if (!prompt.trim()) {
      setError("Please describe your strategy goal to begin.");
      return;
    }

    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY_PROMPT, prompt);
      }
      router.push("/login?next=%2F%3Fresume%3D1");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("prompt", prompt);
        formData.set("workspace_name", workspaceName);
        files.forEach((file) => formData.append("files", file));

        const result = await startWorkspaceFromLanding(formData);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(STORAGE_KEY_PROMPT);
        }

        if (result.failedUploads.length > 0) {
          setMessage(
            `Workspace created. ${result.failedUploads.length} file upload(s) failed: ${result.failedUploads.join(
              ", "
            )}.`
          );
        }

        router.push(result.onboardingUrl);
        router.refresh();
      } catch (startError) {
        const nextMessage =
          startError instanceof Error ? startError.message : "Could not start workspace.";
        setError(nextMessage);
      }
    });
  };

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Start Your Strategy
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        What strategy are you trying to build?
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Describe your goal in plain language. Add documents if you already have draft material.
      </p>

      <div className="mt-5 space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: We are a school improving learner retention and outcomes, and we need a practical data strategy to guide decisions."
          className="min-h-[180px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
        />

        <label className="flex flex-col gap-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-800">Workspace name</span>
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="My Strategy"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
          />
        </label>

        <UploadDropzone files={files} onFilesChange={setFiles} />

        {!isAuthenticated && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            You will sign in before workspace creation. Your typed prompt will be carried over.
          </p>
        )}

        {message && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={!canSubmit}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start
          </button>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
