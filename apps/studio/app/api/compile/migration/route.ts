import { NextResponse } from "next/server";
import {
  CopilotOutputError,
  Graph,
  generateMigrationPlan,
} from "@ixo-studio/core";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;

  const sourceGraph = Graph.safeParse(body["sourceGraph"]);
  const targetGraph = Graph.safeParse(body["targetGraph"]);
  if (!sourceGraph.success || !targetGraph.success) {
    return NextResponse.json(
      { error: "sourceGraph / targetGraph failed validation" },
      { status: 400 }
    );
  }
  const stringFields = [
    "sourceScenarioId",
    "targetScenarioId",
    "sourceName",
    "targetName",
  ] as const;
  for (const f of stringFields) {
    if (typeof body[f] !== "string" || !(body[f] as string).trim()) {
      return NextResponse.json(
        { error: `Missing or empty field: ${f}` },
        { status: 400 }
      );
    }
  }

  try {
    const plan = await generateMigrationPlan({
      sourceGraph: sourceGraph.data,
      targetGraph: targetGraph.data,
      sourceScenarioId: body["sourceScenarioId"] as string,
      targetScenarioId: body["targetScenarioId"] as string,
      sourceName: body["sourceName"] as string,
      targetName: body["targetName"] as string,
    });
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[api/compile/migration] failed:", err);
    if (err instanceof CopilotOutputError) {
      console.error("[api/compile/migration] raw copilot output:\n", err.raw);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
