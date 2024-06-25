import { postgresQuery } from "$lib/postgres";
import type { PageServerLoad } from "./$types";
import type {
  UnstakeAnalytics,
  IncompleteUnstakeAnalytics,
} from "$lib/analytics/types";

export const load: PageServerLoad = async () => {
  try {
    // Query necessary data to calculate analytics for completed Unstake events
    const completedV0EventAnalytics = await postgresQuery(
      `
      SELECT ("returnAmount" - "repayAmount" - "reserveAmount")/2 as pnl, 
      "endTime", "controller", "startTime"
      FROM unstake 
      WHERE (NOT "startBlockHeight"=0) AND (NOT "endBlockHeight"=0) AND (NOT "controller"='')  AND "endTime" <= '2024-06-10T19:52:36Z'
      ORDER BY "startTime"
      `,
      []
    );

    const completedV1EventAnalytics = await postgresQuery(
      `
      SELECT ("returnAmount" - "repayAmount" - "reserveAmount") as pnl, "endTime", "controller", "startTime"
      FROM unstake 
      WHERE (NOT "startBlockHeight"=0) AND (NOT "endBlockHeight"=0) AND (NOT "controller"='') AND "endTime" > '2024-06-10T19:52:36Z'
      ORDER BY "startTime"
      `,
      []
    );

    // Query necessary data to calculate analytics for Unstake events that haven't ended
    const startedEventAnalytics = await postgresQuery(
      `
      SELECT "reserveAmount", "vaultDebt", "debtAmount", "providerRedemption","unbondAmount",  "startTime", "controller" 
      FROM unstake 
      WHERE (NOT "startBlockHeight"=0) AND ("endBlockHeight"=0) AND (NOT "controller"='')
      ORDER BY "startTime"
      `,
      []
    );

    const incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[] =
      startedEventAnalytics.rows.map((row) => ({
        controller: row.controller,
        debtAmount: row.debtAmount,
        providerRedemption: row.providerRedemption,
        reserveAmount: row.reserveAmount,
        startTime: row.startTime,
        unbondAmount: row.unbondAmount,
        vaultDebt: row.vaultDebt,
      }));

    const unstakeAnalyticsData: UnstakeAnalytics[] = [
      ...completedV0EventAnalytics.rows,
      ...completedV1EventAnalytics.rows,
    ].map((row) => ({
      pnl: row.pnl,
      startTime: row.startTime,
      endTime: row.endTime,
      controller: row.controller,
    }));

    return {
      unstakeAnalyticsData,
      incompleteUnstakeAnalytics,
    };
  } catch (err) {
    console.error(err);
    return {
      unstakeAnalyticsData: [],
      incompleteUnstakeAnalytics: [],
    };
  }
};
