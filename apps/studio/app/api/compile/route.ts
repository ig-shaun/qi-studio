import { NextResponse } from "next/server";
import {
  compileIntent,
  emptyGraph,
  validateGraph,
  CopilotOutputError,
} from "@ixo-studio/core";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const { graph, results } = await compileIntent({
      userPrompt: prompt,
      initialGraph: emptyGraph(),
    });
    const violations = validateGraph(graph);
    return NextResponse.json({ graph, results, violations });
  } catch (err) {
    console.error("[api/compile] failed:", err);
    if (err instanceof CopilotOutputError) {
      console.error("[api/compile] raw copilot output:\n", err.raw);
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
