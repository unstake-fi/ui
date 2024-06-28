// import { env } from "$env/dynamic/private";
// const { DATABASE_URL } = env;
// import pkg from "pg";
// const { Pool } = pkg;

// import type { PageServerLoad } from "./$types";
// import type {
//   UnstakeAnalytics,
//   IncompleteUnstakeAnalytics,
// } from "$lib/analytics/types";

// export const createPool = (databaseUrl: string) => {
//   const url = new URL(databaseUrl);
//   const host = url.hostname;
//   const database = url.pathname.slice(1);
//   const password = url.password || "";
//   const port = parseInt(url.port || "5432", 10);
//   const user = url.username;
//   const pool = new Pool({
//     user,
//     host,
//     database,
//     password,
//     port,
//   });

//   return pool;
// };

// export const postgresQuery = (pool: pkg.Pool, text: string, params: string[]) =>
//   pool.query(text, params);

// export const load: PageServerLoad = async () => {
  // const pool = createPool(DATABASE_URL);

  // try {
  //   // Query necessary data to calculate analytics for completed Unstake events
  //   const completedEventAnalytics = await postgresQuery(
  //     `
  //     SELECT "endTime", "controller", "startTime", "protocolFee"
  //     FROM unstake
  //     WHERE (NOT "startBlockHeight"=0) AND (NOT "endBlockHeight"=0) AND (NOT "controller"='')
  //     ORDER BY "startTime"
  //     `,
  //     []
  //   );

  //   // Query necessary data to calculate analytics for Unstake events that haven't ended
  //   const startedEventAnalytics = await postgresQuery(
  //     `
  //     SELECT "reserveAmount", "vaultDebt", "debtAmount", "providerRedemption","unbondAmount",  "startTime", "controller"
  //     FROM unstake
  //     WHERE (NOT "startBlockHeight"=0) AND ("endBlockHeight"=0) AND (NOT "controller"='')
  //     ORDER BY "startTime"
  //     `,
  //     []
  //   );

  //   const incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[] =
  //     startedEventAnalytics.rows.map((row) => ({
  //       controller: row.controller,
  //       debtAmount: row.debtAmount,
  //       providerRedemption: row.providerRedemption,
  //       reserveAmount: row.reserveAmount,
  //       startTime: row.startTime,
  //       unbondAmount: row.unbondAmount,
  //       vaultDebt: row.vaultDebt,
  //     }));

  //   const unstakeAnalyticsData: UnstakeAnalytics[] = completedEventAnalytics.rows.map((row) => ({
  //     pnl: row.protocolFee,
  //     startTime: row.startTime,
  //     endTime: row.endTime,
  //     controller: row.controller,
  //   }));

  //   return {
  //     unstakeAnalyticsData,
  //     incompleteUnstakeAnalytics,
  //   };
  // } catch (err) {
  //   console.error(err);
  //   return {
  //     unstakeAnalyticsData: [],
  //     incompleteUnstakeAnalytics: [],
  //   };
  // }
// };
