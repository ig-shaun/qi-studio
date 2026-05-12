import { NextRequest, NextResponse } from "next/server";
import {
  buildIxoPortalManifest,
  buildPortalCorsHeaders,
  parseExactOrigins,
  resolveIxoPortalManifestOrigin,
} from "@/src/features/portal/contract";

export const dynamic = "force-dynamic";

export function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(request),
  });
}

export function GET(request: NextRequest) {
  try {
    const origin = resolveIxoPortalManifestOrigin(
      request.url,
      process.env.QI_STUDIO_PUBLIC_ORIGIN
    );
    return NextResponse.json(buildIxoPortalManifest(origin), {
      headers: {
        ...responseHeaders(request),
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      {
        status: 500,
        headers: responseHeaders(request),
      }
    );
  }
}

function responseHeaders(request: NextRequest): Record<string, string> {
  let allowedOrigins: string[] = [];
  try {
    allowedOrigins = parseExactOrigins(
      process.env.NEXT_PUBLIC_IXO_PORTAL_ALLOWED_ORIGINS ?? ""
    );
  } catch {
    allowedOrigins = [];
  }
  return buildPortalCorsHeaders(request.headers.get("origin"), allowedOrigins);
}
