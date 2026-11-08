import { query } from "./db";

export type VerificationLevel = 1 | 2;

/** How long an approval stays valid once granted. PRD.md: level 2 must stay "fresh" (5 min). */
export const APPROVED_VALIDITY_MS: Record<VerificationLevel, number> = {
  1: 30 * 60 * 1000,
  2: 5 * 60 * 1000,
};

/** How long a request stays open before it's considered stale if nobody responds. */
export const PENDING_TIMEOUT_MS = 10 * 60 * 1000;

type VerificationRow = {
  id: string;
  customer_id: string;
  level: number;
  status: string;
  expires_at: string;
};

/** True if the customer has an approved, unexpired verification at or above minLevel. */
export async function hasValidVerification(
  customerId: string,
  minLevel: VerificationLevel,
): Promise<boolean> {
  const rows = await query<VerificationRow>(
    `SELECT id, level, status, expires_at FROM verifications
     WHERE customer_id = $1 AND status = 'approved' AND level >= $2
     ORDER BY expires_at DESC
     LIMIT 1`,
    [customerId, minLevel],
  );
  const row = rows[0];
  if (!row) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}

/** Status as it should be reported right now, lazily expiring stale rows without a write. */
export function effectiveStatus(row: VerificationRow): string {
  if ((row.status === "approved" || row.status === "pending") && new Date(row.expires_at).getTime() <= Date.now()) {
    return "expired";
  }
  return row.status;
}
