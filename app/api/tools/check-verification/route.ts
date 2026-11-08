import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { effectiveStatus } from "@/lib/verification";

type VerificationRow = {
  id: string;
  customer_id: string;
  level: number;
  status: string;
  expires_at: string;
};

/** Noor's check_verification tool (PRD.md 6.1). */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { verification_id } = body.parameters ?? {};

  if (!verification_id) {
    return NextResponse.json({ result: { error: true, message: "verification_id is required." } });
  }

  const rows = await query<VerificationRow>(
    `SELECT id, customer_id, level, status, expires_at FROM verifications WHERE id = $1`,
    [verification_id],
  );
  const row = rows[0];

  if (!row) {
    return NextResponse.json({ result: { error: true, message: "No verification found with that ID." } });
  }

  const status = effectiveStatus(row);
  await logAudit(row.customer_id, "check_verification", { verification_id, status });

  return NextResponse.json({ result: { status } });
}
