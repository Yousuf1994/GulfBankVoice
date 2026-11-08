import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";

type CustomerRow = {
  id: string;
  name: string;
  preferred_languages: string[];
  email: string | null;
  mobile: string | null;
  address: string | null;
};

/** Noor's "get customer profile" tool. See PRD.md section 6.1. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const { id } = await params;
  const rows = await query<CustomerRow>(
    `SELECT id, name, preferred_languages, email, mobile, address FROM customers WHERE id = $1`,
    [id],
  );
  const customer = rows[0];

  if (!customer) {
    await logAudit(id, "get_customer_profile", { found: false });
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await logAudit(id, "get_customer_profile", { found: true });
  return NextResponse.json(customer);
}
