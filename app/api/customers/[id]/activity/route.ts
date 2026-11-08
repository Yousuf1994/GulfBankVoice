import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type AuditRow = {
  id: string;
  created_at: string;
  who: string;
  what: string;
  result: unknown;
};

/**
 * Feeds the /call page's tool-activity panel: recent audit_log rows for this
 * customer, for the page to poll while a call is active. Page-internal, not
 * one of Noor's tools, so no X-Tool-Secret.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await query<AuditRow>(
    `SELECT id, created_at, who, what, result FROM audit_log
     WHERE who = $1
     ORDER BY created_at DESC
     LIMIT 25`,
    [id],
  );

  return NextResponse.json({ activity: rows });
}
