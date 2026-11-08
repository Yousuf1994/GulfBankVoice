import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import { APPROVED_VALIDITY_MS, type VerificationLevel } from "@/lib/verification";

type VerificationRow = {
  id: string;
  customer_id: string;
  level: number;
  status: string;
};

/**
 * The customer's own action in the phone panel -- approve or deny a pending
 * request. Page-internal (simulates tapping the bank app), not one of Noor's
 * tools, so no X-Tool-Secret.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body ?? {};

  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ error: "action must be 'approve' or 'deny'." }, { status: 400 });
  }

  const rows = await query<VerificationRow>(
    `SELECT id, customer_id, level, status FROM verifications WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Verification not found." }, { status: 404 });
  }

  if (action === "approve") {
    const level = row.level as VerificationLevel;
    const expiresAt = new Date(Date.now() + APPROVED_VALIDITY_MS[level]).toISOString();
    await query(`UPDATE verifications SET status = 'approved', expires_at = $2 WHERE id = $1`, [id, expiresAt]);
  } else {
    await query(`UPDATE verifications SET status = 'denied' WHERE id = $1`, [id]);
  }

  await logAudit(row.customer_id, `verification_${action}d`, { verification_id: id, level: row.level });

  return NextResponse.json({ ok: true });
}
