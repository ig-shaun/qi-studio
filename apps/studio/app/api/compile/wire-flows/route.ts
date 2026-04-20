import { NextResponse } from "next/server";
import { wireFlows, type Graph } from "@ixo-studio/core";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { graph?: Graph } | null;
  const graph = body?.graph;
  if (!graph) {
    return NextResponse.json({ error: "Missing graph" }, { status: 400 });
  }

  try {
    const result = await wireFlows({ graph, userPrompt: "" });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/compile/wire-flows] failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
