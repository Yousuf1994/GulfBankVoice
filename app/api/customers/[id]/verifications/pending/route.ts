import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { effectiveStatus } from "@/lib/verification";

type VerificationRow = {
  id: string;
  customer_id: string;
  level: number;
  status: string;
  expires_at: string;
};

/**
 * Feeds the /call page's phone panel: is there a pending approval right now
 * for this customer? Page-internal (the app panel polling its own backend),
 * not one of Noor's tools, so no X-Tool-Secret.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await query<VerificationRow>(
    `SELECT id, customer_id, level, status, expires_at FROM verifications
     WHERE customer_id = $1
     ORDER BY expires_at DESC
     LIMIT 1`,
    [id],
  );
  const row = rows[0];

  if (!row || effectiveStatus(row) !== "pending") {
    return NextResponse.json({ pending: null });
  }

  return NextResponse.json({
    pending: { id: row.id, level: row.level },
  });
}
