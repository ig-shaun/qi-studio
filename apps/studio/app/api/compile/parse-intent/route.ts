import { NextResponse } from "next/server";
import { parseIntent } from "@ixo-studio/core";
import { emptyGraph } from "@ixo-studio/core";
import { formatCompileError } from "../error-message";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const result = await parseIntent({ graph: emptyGraph(), userPrompt: prompt });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: formatCompileError(err) }, { status: 500 });
  }
}
