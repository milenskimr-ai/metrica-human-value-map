import "server-only";
import mysql, { type Pool } from "mysql2/promise";

/**
 * Server-only MySQL connection pool. Credentials come from environment
 * variables and are never sent to the browser.
 */

let pool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MYSQL_DATABASE && process.env.MYSQL_USER && (process.env.MYSQL_HOST || process.env.MYSQL_SOCKET));
}

/** Returns null when MySQL is not configured. */
export function getDb(): Pool | null {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      socketPath: process.env.MYSQL_SOCKET || undefined,
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
      charset: "utf8mb4",
      timezone: "Z", // JS Dates <-> DATETIME are always UTC
      connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 5), // small: shares the server with other apps
      connectTimeout: 5_000,
      enableKeepAlive: true,
    });
    // DB-side defaults (created_at / updated_at) must also be UTC.
    pool.on("connection", (conn) => {
      conn.query("SET time_zone = '+00:00'");
    });
  }
  return pool;
}
