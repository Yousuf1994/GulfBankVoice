import { NextRequest, NextResponse } from "next/server";

/**
 * Enforces the X-Tool-Secret header on endpoints Noor's agent tools call.
 * Returns a NextResponse to send back immediately, or null to continue.
 */
export function requireToolSecret(request: NextRequest): NextResponse | null {
  const expected = process.env.TOOL_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Server is missing its TOOL_SECRET configuration." },
      { status: 500 },
    );
  }

  const provided = request.headers.get("x-tool-secret");
  if (provided !== expected) {
    return NextResponse.json(
      { error: "Missing or invalid X-Tool-Secret header." },
      { status: 401 },
    );
  }

  return null;
}
