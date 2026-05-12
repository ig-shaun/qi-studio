import { NextRequest, NextResponse } from "next/server";
import {
  buildPortalFrameAncestorsCsp,
  parseExactOrigins,
} from "@/src/features/portal/contract";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.searchParams.get("portal") !== "1") {
    return response;
  }

  let allowedOrigins: string[] = [];
  try {
    allowedOrigins = parseExactOrigins(
      process.env.NEXT_PUBLIC_IXO_PORTAL_ALLOWED_ORIGINS ?? ""
    );
  } catch {
    return response;
  }
  const frameAncestors = buildPortalFrameAncestorsCsp(allowedOrigins);

  if (frameAncestors) {
    response.headers.set("Content-Security-Policy", frameAncestors);
  }

  return response;
}

export const config = {
  matcher: ["/"],
};
