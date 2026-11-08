import { randomUUID } from "crypto";
import { query } from "./db";

/** Records who did what and the outcome, per CLAUDE.md's "every endpoint writes to audit_log" rule. */
export async function logAudit(who: string, what: string, result: unknown) {
  await query(
    `INSERT INTO audit_log (id, who, what, result) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), who, what, JSON.stringify(result)],
  );
}
