"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fileExtension,
  getImportExpirationIso,
  getImportMaxFileBytes,
  IMPORT_BUCKET,
  isSupportedImportFile,
} from "@/lib/import-config";

type StartWorkspaceResult = {
  workspaceId: string;
  onboardingUrl: string;
  uploadedCount: number;
  failedUploads: string[];
};

function validatePrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error("Please describe your strategy goal before starting.");
  }
  if (trimmed.length > 4000) {
    throw new Error("Prompt is too long. Keep it under 4000 characters.");
  }
  return trimmed;
}

function getFiles(formData: FormData) {
  const rawFiles = formData.getAll("files");
  return rawFiles.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validateFile(file: File) {
  if (!isSupportedImportFile(file)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  const maxBytes = getImportMaxFileBytes();
  if (file.size > maxBytes) {
    throw new Error(
      `${file.name} exceeds max size of ${Math.floor(maxBytes / (1024 * 1024))}MB.`
    );
  }
}

export async function startWorkspaceFromLanding(
  formData: FormData
): Promise<StartWorkspaceResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const prompt = validatePrompt(String(formData.get("prompt") ?? ""));
  const files = getFiles(formData);
  files.forEach(validateFile);

  const workspaceName = (String(formData.get("workspace_name") ?? "").trim() || "My Strategy")
    .slice(0, 120);
  const intakeContext = {
    source: "landing_start",
    createdAt: new Date().toISOString(),
  };

  const { data: workspace, error: createError } = await supabase
    .from("workspaces")
    .insert({
      user_id: user.id,
      name: workspaceName,
      onboarding_status: "pending",
      onboarding_version: null,
      intake_prompt: prompt,
      intake_context: intakeContext,
    })
    .select("id")
    .single<{ id: string }>();

  if (createError || !workspace) {
    throw new Error(createError?.message ?? "Could not create workspace.");
  }

  const failedUploads: string[] = [];
  let uploadedCount = 0;

  for (const file of files) {
    const extension = fileExtension(file.name) || "bin";
    const documentId = randomUUID();
    const storagePath = `${user.id}/${workspace.id}/${documentId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMPORT_BUCKET)
      .upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      failedUploads.push(file.name);
      continue;
    }

    const { error: documentError } = await supabase.from("workspace_documents").insert({
      id: documentId,
      workspace_id: workspace.id,
      user_id: user.id,
      storage_path: storagePath,
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      status: "uploaded",
      source: "landing_intake",
      expires_at: getImportExpirationIso(),
    });

    if (documentError) {
      failedUploads.push(file.name);
      continue;
    }

    uploadedCount += 1;
  }

  const nextPath = `/canvas?workspace=${workspace.id}`;
  const onboardingUrl =
    process.env.ONBOARDING_V1_ENABLED === "true"
      ? `/onboarding?workspace=${workspace.id}&next=${encodeURIComponent(nextPath)}`
      : nextPath;

  revalidatePath("/");
  revalidatePath("/canvas");
  revalidatePath("/dashboard");

  return {
    workspaceId: workspace.id,
    onboardingUrl,
    uploadedCount,
    failedUploads,
  };
}
