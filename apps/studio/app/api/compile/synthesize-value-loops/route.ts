import { NextResponse } from "next/server";
import {
  synthesizeValueLoops,
  CopilotOutputError,
  type Graph,
} from "@ixo-studio/core";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req
    .json()
    .catch(() => null)) as { graph?: Graph } | null;
  const graph = body?.graph;
  if (!graph) {
    return NextResponse.json({ error: "Missing graph" }, { status: 400 });
  }

  try {
    const result = await synthesizeValueLoops({ graph, userPrompt: "" });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/compile/synthesize-value-loops] failed:", err);
    if (err instanceof CopilotOutputError) {
      console.error("[raw copilot output]\n", err.raw);
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
