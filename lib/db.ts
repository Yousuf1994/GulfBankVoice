import { Pool, type QueryResultRow } from "pg";

// Reused across hot reloads in dev and across invocations in serverless, so we
// don't open a new connection pool on every request.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

// Lazy: reading env vars and opening the pool happens on first real query, not
// at import time -- `next build` imports every route module to collect its
// metadata, and that must succeed even before a database is configured.
function getPool(): Pool {
  if (globalForPg.pgPool) return globalForPg.pgPool;

  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing POSTGRES_URL (or DATABASE_URL). Add a Postgres database in Vercel's " +
        "Storage tab, then put its connection string in .env.local (and Vercel's " +
        "environment variables) as POSTGRES_URL.",
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  globalForPg.pgPool = pool;
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function rawQuery(text: string) {
  return getPool().query(text);
}
