import { env } from "$env/dynamic/private";
import type { CacheContainer } from "node-ts-cache";
import pkg from "pg";
import { fromBech32 } from "@cosmjs/encoding";

const pool = new pkg.Pool({
  connectionString: env["DATABASE_URL"],
});

export const connectToDb = async () => await pool.connect();

export async function getCachedDBResults(
  cache: CacheContainer,
  db: pkg.PoolClient,
  query: string,
  key: string,
  ttl: number
) {
  const cachedData = await cache.getItem<pkg.QueryResult<any>>(key);

  if (cachedData) {
    return cachedData;
  }

  const data = await postgresQuery(db, query, []);
  await cache.setItem(key, data, { ttl: ttl });
  return data;
}

const postgresQuery = (db: pkg.PoolClient, text: string, params: string[]) =>
  db.query(text, params);

/**
 * Queries started unstaking records based on cursor pagination parameters.
 *
 * If prevId and prevTimestamp are not specified, queries the first page.
 * Otherwise, queries the next page based on prevId and prevTimestamp as cursors.
 *
 * @param db Postgres DB client
 * @param limit The maximum number of results in a single page
 * @param prevDelegate The delegate of the last retrieved unstake record.
 * @param prevTimestamp The timestamp of the last retrieved unstake record.
 * @param controller An optional controller for the unstake records
 * @returns An error code and error message if the parameters are invalid.
 * Otherwise, returns the unstake records.
 */
export const getPaginatedUnstakings = async (
  db: pkg.PoolClient,
  limit: string | null,
  prevDelegate: string | null,
  prevTimestamp: string | null,
  controller: string | null
) => {
  try {
    const parsedLimit = parseInt(limit || "10", 10);
    if (parsedLimit > 100 || parsedLimit <= 0) {
      return {
        error: "Please specify a limit between 0 and 100",
        status: 422,
      };
    }

    // Verify controller is a bech32
    if (controller) {
      try {
        if (fromBech32(controller).prefix !== "kujira") {
          return {
            error: "Invalid controller address",
            status: 422,
          };
        }
      } catch (err) {
        return {
          error: "Invalid controller address",
          status: 422,
        };
      }
    }

    let paramIdx = 1;
    const params: string[] = [];

    let sql = `
    SELECT "delegate", "unbondAmount", "borrowAmount" as "offerAmount", "controller", "startTime" as "timestamp", "startBlockHeight"
    FROM unstake
    WHERE "startBlockHeight" != 0
    `;

    if (controller !== null) {
      sql += `AND "controller" = $${paramIdx++} `;
      params.push(controller);
    }

    if (prevTimestamp) {
      sql += `AND "startTime" < $${paramIdx++} `;
      params.push(prevTimestamp);
    }

    if (prevDelegate) {
      sql += `AND "delegate" < $${paramIdx++} `;
      params.push(prevDelegate);
    }

    sql += `
    ORDER BY "startTime" DESC, "delegate" DESC
    LIMIT $${paramIdx}
    `;
    params.push(`${parsedLimit}`);

    // Apply cursor pagination to fetch the next page
    const res = await postgresQuery(db, sql, params);

    return { data: res.rows };
  } catch (err) {
    console.error(err);
    return { error: "Internal Server Error", status: 500 };
  }
};
