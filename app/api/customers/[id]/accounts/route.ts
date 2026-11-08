import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";

type AccountRow = {
  id: string;
  type: "current" | "salary" | "savings";
  balance_aed: string;
  masked_iban: string;
};

/** Noor's "list accounts" tool. See PRD.md section 6.1. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const { id } = await params;
  const accounts = await query<AccountRow>(
    `SELECT id, type, balance_aed, masked_iban FROM accounts WHERE customer_id = $1 ORDER BY id`,
    [id],
  );

  await logAudit(id, "list_accounts", { count: accounts.length });
  return NextResponse.json(accounts);
}
