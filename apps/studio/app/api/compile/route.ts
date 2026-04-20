import {
  compileIntent,
  emptyGraph,
  validateGraph,
  CopilotOutputError,
  PASS_ORDER,
} from "@ixo-studio/core";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      write({ type: "plan", passes: PASS_ORDER });

      try {
        const { graph, results } = await compileIntent({
          userPrompt: prompt,
          initialGraph: emptyGraph(),
          onBeforeStep: (passId) => {
            write({ type: "pass-start", passId });
          },
          onStep: (result) => {
            write({
              type: "pass-done",
              passId: result.passId,
              rationale: result.patch.rationale,
              opCount: result.patch.ops.length,
            });
          },
        });
        const violations = validateGraph(graph);
        write({ type: "done", graph, results, violations });
      } catch (err) {
        console.error("[api/compile] failed:", err);
        if (err instanceof CopilotOutputError) {
          console.error("[api/compile] raw copilot output:\n", err.raw);
        }
        const message = err instanceof Error ? err.message : String(err);
        write({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
