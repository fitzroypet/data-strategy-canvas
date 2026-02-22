import { NextResponse } from "next/server";
import { expireWorkspaceDocuments } from "@/app/actions/imports";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.IMPORT_CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireWorkspaceDocuments();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Expiry failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

